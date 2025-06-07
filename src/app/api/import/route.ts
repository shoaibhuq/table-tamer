import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { eventService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { OpenAI } from "openai";

const openai = new OpenAI();

interface GuestGroup {
  id: string;
  name: string;
  members: string[];
  suggestedTableSize?: number;
}

interface ProcessedGuest {
  name: string;
  phoneNumber?: string;
  email?: string;
  groupId?: string;
  groupInfo?: string;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;
    const eventId = data.get("eventId") as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: "No file uploaded.",
      });
    }

    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: "Event ID is required. Please select an event first.",
      });
    }

    // Validate file type and size
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const fileName = file.name.toLowerCase();
    const isValidFile =
      allowedTypes.includes(file.type) ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls");

    if (!isValidFile) {
      return NextResponse.json({
        success: false,
        error: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
      });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: "File size must be less than 10MB",
      });
    }

    // Verify the event exists and user owns it
    const event = await eventService.get(userId, eventId);
    if (!event) {
      return NextResponse.json({
        success: false,
        error: "Event not found. Please select a valid event.",
      });
    }

    // Parse file with better error handling
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let workbook;
    let jsonData: unknown[][];

    try {
      if (fileName.endsWith(".csv")) {
        const fileContent = buffer.toString("utf8");
        // Clean the CSV content
        const cleanedContent = fileContent
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .join("\n");
        workbook = XLSX.read(cleanedContent, { type: "string" });
      } else {
        workbook = XLSX.read(buffer, { type: "buffer" });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    } catch (parseError) {
      console.error("File parsing error:", parseError);
      return NextResponse.json({
        success: false,
        error:
          "Failed to parse file. Please check that your file is properly formatted.",
      });
    }

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json({
        success: false,
        error: "File appears to be empty or contains no readable data.",
      });
    }

    // Filter out completely empty rows and prepare sample data
    const validRows = jsonData.filter(
      (row) =>
        row &&
        Array.isArray(row) &&
        row.some(
          (cell) =>
            cell !== null && cell !== undefined && String(cell).trim() !== ""
        )
    );

    if (validRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid data found in the file.",
      });
    }

    // Take sample data for AI analysis (more robust sampling)
    const sampleSize = Math.min(10, validRows.length);
    const sampleData = validRows
      .slice(0, sampleSize)
      .map((row) =>
        row
          .map((cell) =>
            cell === null || cell === undefined
              ? ""
              : String(cell).replace(/,/g, ";")
          )
          .join(",")
      )
      .join("\n");

    // Enhanced AI analysis with better error handling
    let aiResponse;
    let columnMapping;

    try {
      aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a data parsing assistant for event planning. Analyze spreadsheet data to identify guest information and group relationships.

IMPORTANT: You MUST return valid JSON only. No explanations, no markdown, just pure JSON.

TASK: Identify columns and detect guest groups
1. Find column indexes for: name (required), phoneNumber (optional), email (optional)
2. Detect if there are group indicators like: family names, table preferences, group IDs, party names, +1 indicators, etc.
3. Determine if first row is a header

Return ONLY this JSON structure:
{
  "nameIndex": number,
  "phoneIndex": number | null,
  "emailIndex": number | null,
  "hasHeader": boolean,
  "groupIndicators": {
    "hasGroups": boolean,
    "groupColumnIndex": number | null,
    "groupType": "family" | "party" | "table" | "id" | "plus_one" | null,
    "description": "string describing how groups are indicated"
  }
}

Examples of group indicators:
- Same last names (family groups)
- Column with "Table 1", "Table A" (table assignments)
- Column with "Smith Party", "Wedding Party" (party names)
- Column with group IDs "G001", "Group1" 
- Names like "John Smith +1", "Jane Doe + Guest"`,
          },
          {
            role: "user",
            content: `Analyze this data sample:\n${sampleData}`,
          },
        ],
        temperature: 0,
        max_tokens: 500,
      });
    } catch (aiError) {
      console.error("AI analysis error:", aiError);
      if (aiError instanceof OpenAI.APIError) {
        if (aiError.status === 401) {
          return NextResponse.json({
            success: false,
            error:
              "OpenAI API key is invalid or missing. Please check your configuration.",
          });
        }
        return NextResponse.json({
          success: false,
          error: `AI service error: ${aiError.message}`,
        });
      }
      return NextResponse.json({
        success: false,
        error:
          "AI analysis failed. Please try again or check your file format.",
      });
    }

    // Parse AI response with robust error handling
    try {
      const aiContent = aiResponse.choices[0]?.message?.content;
      if (!aiContent) {
        throw new Error("Empty AI response");
      }

      // Clean the response - remove any markdown formatting or extra text
      let cleanedContent = aiContent.trim();

      // Remove markdown code blocks if present
      if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent
          .replace(/^```(?:json)?\s*/, "")
          .replace(/\s*```$/, "");
      }

      // Try to find JSON within the response if it's wrapped in text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }

      columnMapping = JSON.parse(cleanedContent);

      // Validate the required structure
      if (typeof columnMapping !== "object" || columnMapping === null) {
        throw new Error("Invalid response structure");
      }

      if (!("nameIndex" in columnMapping) || !("hasHeader" in columnMapping)) {
        throw new Error("Missing required fields in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error(
        "AI Response content:",
        aiResponse.choices[0]?.message?.content
      );

      // Fallback: try to manually detect columns
      const firstRow = validRows[0] || [];
      let nameIndex = -1;
      let phoneIndex = -1;
      let emailIndex = -1;

      // Simple column detection as fallback
      for (let i = 0; i < firstRow.length; i++) {
        const cellValue = String(firstRow[i] || "").toLowerCase();
        if (
          nameIndex === -1 &&
          (cellValue.includes("name") || cellValue.includes("guest"))
        ) {
          nameIndex = i;
        } else if (
          phoneIndex === -1 &&
          (cellValue.includes("phone") ||
            cellValue.includes("tel") ||
            cellValue.includes("mobile"))
        ) {
          phoneIndex = i;
        } else if (emailIndex === -1 && cellValue.includes("email")) {
          emailIndex = i;
        }
      }

      // If no header detected, assume first column is name
      if (nameIndex === -1) {
        nameIndex = 0;
      }

      columnMapping = {
        nameIndex: nameIndex,
        phoneIndex: phoneIndex === -1 ? null : phoneIndex,
        emailIndex: emailIndex === -1 ? null : emailIndex,
        hasHeader: firstRow.some(
          (cell) =>
            String(cell || "")
              .toLowerCase()
              .includes("name") ||
            String(cell || "")
              .toLowerCase()
              .includes("phone") ||
            String(cell || "")
              .toLowerCase()
              .includes("email")
        ),
        groupIndicators: {
          hasGroups: false,
          groupColumnIndex: null,
          groupType: null,
          description: "No groups detected due to AI parsing error",
        },
      };
    }

    const { nameIndex, phoneIndex, emailIndex, hasHeader, groupIndicators } =
      columnMapping;

    if (nameIndex === null || nameIndex === undefined || nameIndex < 0) {
      return NextResponse.json({
        success: false,
        error:
          'Could not identify the "name" column in the file. Please ensure there is a column for guest names.',
      });
    }

    const dataRows = hasHeader ? validRows.slice(1) : validRows;

    // Process guests with enhanced validation
    const processedGuests: ProcessedGuest[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || !Array.isArray(row) || nameIndex >= row.length) continue;

      const name = String(row[nameIndex] || "").trim();
      if (!name || name.length === 0) continue;

      const guest: ProcessedGuest = {
        name: name,
        phoneNumber:
          phoneIndex !== null && phoneIndex !== undefined && row[phoneIndex]
            ? String(row[phoneIndex]).trim()
            : undefined,
        email:
          emailIndex !== null && emailIndex !== undefined && row[emailIndex]
            ? String(row[emailIndex]).trim()
            : undefined,
        groupInfo:
          groupIndicators?.hasGroups &&
          groupIndicators?.groupColumnIndex !== null &&
          row[groupIndicators.groupColumnIndex]
            ? String(row[groupIndicators.groupColumnIndex]).trim()
            : undefined,
      };

      // Clean phone number
      if (guest.phoneNumber) {
        const cleanPhone = guest.phoneNumber
          .replace(/[^\d+\-().\s]/g, "")
          .trim();
        guest.phoneNumber = cleanPhone.length > 0 ? cleanPhone : undefined;
      }

      // Validate email
      if (guest.email && !guest.email.includes("@")) {
        guest.email = undefined;
      }

      processedGuests.push(guest);
    }

    if (processedGuests.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid guest data found in the file.",
      });
    }

    // Detect groups using AI if group indicators were found
    let detectedGroups: GuestGroup[] = [];

    if (groupIndicators?.hasGroups && processedGuests.length > 1) {
      try {
        const groupAnalysisPrompt = processedGuests
          .map(
            (guest) =>
              `${guest.name}${guest.groupInfo ? ` | ${guest.groupInfo}` : ""}`
          )
          .join("\n");

        const groupResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an event planner assistant. Create logical guest groups from the provided data.

IMPORTANT: Return ONLY valid JSON array. No explanations, no markdown, just pure JSON.

RULES:
1. Group guests who clearly belong together (same last names, explicit group indicators, +1s)
2. Keep groups reasonable in size (2-8 people typically)
3. Generate meaningful group names
4. Suggest appropriate table sizes

Return ONLY this JSON structure:
[
  {
    "id": "unique_id",
    "name": "descriptive_group_name", 
    "members": ["guest_name1", "guest_name2"],
    "suggestedTableSize": number
  }
]

Only return groups with 2+ members. Single guests will be handled separately.`,
            },
            {
              role: "user",
              content: `Group these guests based on the indicators:\n${groupAnalysisPrompt}\n\nGroup type: ${groupIndicators.groupType}\nDescription: ${groupIndicators.description}`,
            },
          ],
          temperature: 0,
          max_tokens: 1000,
        });

        const groupContent = groupResponse.choices[0]?.message?.content;
        if (groupContent) {
          let cleanedGroupContent = groupContent.trim();

          // Remove markdown formatting
          if (cleanedGroupContent.startsWith("```")) {
            cleanedGroupContent = cleanedGroupContent
              .replace(/^```(?:json)?\s*/, "")
              .replace(/\s*```$/, "");
          }

          // Try to find JSON array within the response
          const arrayMatch = cleanedGroupContent.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            cleanedGroupContent = arrayMatch[0];
          }

          const groupsData = JSON.parse(cleanedGroupContent);
          if (Array.isArray(groupsData)) {
            detectedGroups = groupsData.filter(
              (group) =>
                group &&
                group.members &&
                Array.isArray(group.members) &&
                group.members.length >= 2
            );
          }
        }
      } catch (error) {
        console.error("Error in group detection:", error);
        // Continue without groups if AI fails
        detectedGroups = [];
      }
    }

    // Return processed data without saving to Firebase
    return NextResponse.json({
      success: true,
      processedGuests: processedGuests,
      detectedGroups: detectedGroups,
      hasGroups: detectedGroups.length > 0,
      groupIndicators: groupIndicators,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      message: `Successfully processed ${
        processedGuests.length
      } guests from file.${
        detectedGroups.length > 0
          ? ` Found ${detectedGroups.length} guest groups.`
          : ""
      }`,
    });
  } catch (error) {
    console.error("Import processing error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({
      success: false,
      error: `Failed to process file. Details: ${errorMessage}`,
    });
  }
}
