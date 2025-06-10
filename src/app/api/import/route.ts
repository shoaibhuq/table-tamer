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
  groupType?:
    | "table_explicit"
    | "group_id"
    | "pattern"
    | "family"
    | "corporate"
    | "plus_one";
  confidence?: "high" | "medium" | "low";
  reasoning?: string;
}

interface ProcessedGuest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
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
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a specialized table assignment AI assistant for event seating management. Your PRIMARY MISSION is to identify explicit table/group identifiers and optimize guest data for table-based seating arrangements.

CRITICAL: Return ONLY valid JSON. No explanations, markdown, or additional text.

TABLE-FOCUSED ANALYSIS PRIORITIES:

1. COLUMN IDENTIFICATION (Standard guest info):
   - firstName: Variations (first, fname, given name, etc.)
   - lastName: Variations (last, lname, surname, family name, etc.)
   - name/fullName: Combined name fields (full name, guest name, etc.)
   - phoneNumber: Contact fields (phone, tel, mobile, cell, etc.)
   - email: Email fields (email, e-mail, contact email, etc.)

2. **HIGHEST PRIORITY - EXPLICIT TABLE/GROUP IDENTIFIERS:**
   SCAN FOR THESE CRITICAL COLUMNS FIRST:
   - Table numbers: "table", "table #", "table number", "seating", "assigned table"
   - Group IDs: "group", "group #", "group id", "group number", "party #", "party id"
   - Team/Party names: "team", "party", "delegation", "organization"
   - Numerical groupings: Any column with consistent numeric patterns (1,1,1,2,2,3,3)
   - Alphabetical groups: Consistent letter patterns (A,A,B,B,C,C)

3. **SECONDARY - TABLE-SUITABLE GROUPING PATTERNS:**
   Only if NO explicit identifiers found:
   - Same surnames (family seating)
   - Plus-one patterns (Guest of X, +1 indicators)
   - Corporate affiliations (same company for business events)

4. **CRITICAL GROUP COLUMN DETECTION:**
   Look for columns containing ANY of these terms (case-insensitive):
   - "group", "group #", "group number", "group id"
   - "table", "table #", "table number", "table assignment"
   - "party", "party #", "party id", "party number"
   - "team", "team #", "team number"
   - Numeric columns with repeated values (1,1,2,2,3,3)
   
5. **DETECTION CONFIDENCE RULES:**
   - HIGH: Explicit table/group number columns found
   - MEDIUM: Clear patterns in dedicated grouping columns
   - LOW: Only implicit relationship patterns available

OPTIMIZED JSON RESPONSE:
{
  "firstNameIndex": number | null,
  "lastNameIndex": number | null,
  "nameIndex": number | null,
  "phoneIndex": number | null,
  "emailIndex": number | null,
  "hasHeader": boolean,
  "groupIndicators": {
    "hasGroups": boolean,
    "groupColumnIndex": number | null,
    "groupType": "table_explicit" | "group_id" | "party_name" | "family" | "corporate" | "plus_one" | null,
    "description": "explanation of table grouping method found",
    "confidence": "high" | "medium" | "low",
    "tableOptimized": boolean
  }
}

CRITICAL PRIORITIZATION:
1. **EXPLICIT TABLE COLUMNS = ALWAYS HIGH PRIORITY & HIGH CONFIDENCE**
2. Dedicated group/party ID columns = High priority
3. Consistent numerical/alphabetical patterns = Medium priority  
4. Relationship-based grouping = Low priority fallback
5. If explicit table data found, set "tableOptimized": true`,
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
      let firstNameIndex = -1;
      let lastNameIndex = -1;
      let nameIndex = -1;
      let phoneIndex = -1;
      let emailIndex = -1;

      // Enhanced fallback detection including group columns
      let groupColumnIndex = -1;
      let groupType: string | null = null;

      for (let i = 0; i < firstRow.length; i++) {
        const cellValue = String(firstRow[i] || "").toLowerCase();

        // Check for firstName variations
        if (
          firstNameIndex === -1 &&
          (cellValue.includes("first") ||
            cellValue.includes("fname") ||
            cellValue.includes("given"))
        ) {
          firstNameIndex = i;
        }
        // Check for lastName variations
        else if (
          lastNameIndex === -1 &&
          (cellValue.includes("last") ||
            cellValue.includes("lname") ||
            cellValue.includes("surname") ||
            cellValue.includes("family"))
        ) {
          lastNameIndex = i;
        }
        // Check for general name column
        else if (
          nameIndex === -1 &&
          (cellValue.includes("name") || cellValue.includes("guest"))
        ) {
          nameIndex = i;
        }
        // Check for phone variations
        else if (
          phoneIndex === -1 &&
          (cellValue.includes("phone") ||
            cellValue.includes("tel") ||
            cellValue.includes("mobile") ||
            cellValue.includes("contact"))
        ) {
          phoneIndex = i;
        }
        // Check for email variations
        else if (
          emailIndex === -1 &&
          (cellValue.includes("email") || cellValue.includes("e-mail"))
        ) {
          emailIndex = i;
        }
        // Check for group/table columns (enhanced detection)
        else if (
          groupColumnIndex === -1 &&
          (cellValue.includes("group") ||
            cellValue.includes("table") ||
            cellValue.includes("party") ||
            cellValue.includes("team") ||
            cellValue.includes("seating") ||
            cellValue.includes("assignment") ||
            cellValue.includes("allocation") ||
            cellValue.includes("section") ||
            cellValue.includes("room") ||
            cellValue.includes("area") ||
            cellValue.includes("zone") ||
            cellValue.includes("squad") ||
            cellValue.includes("cluster") ||
            cellValue.includes("pod") ||
            cellValue.includes("circle") ||
            cellValue.includes("cabin") ||
            cellValue.includes("house") ||
            cellValue.includes("division") ||
            cellValue.includes("category") ||
            cellValue.includes("class") ||
            cellValue.includes("unit"))
        ) {
          groupColumnIndex = i;
          if (cellValue.includes("table")) {
            groupType = "table_explicit";
          } else if (
            cellValue.includes("group") ||
            cellValue.includes("party") ||
            cellValue.includes("team")
          ) {
            groupType = "group_id";
          } else {
            groupType = "pattern";
          }
        }
      }

      // Check for numeric pattern columns if no explicit group column found
      if (groupColumnIndex === -1) {
        for (let i = 0; i < firstRow.length; i++) {
          const cellValue = String(firstRow[i] || "").toLowerCase();
          // Skip already identified columns
          if (
            i === firstNameIndex ||
            i === lastNameIndex ||
            i === nameIndex ||
            i === phoneIndex ||
            i === emailIndex
          ) {
            continue;
          }

          // Check if this could be a numeric grouping column (enhanced patterns)
          if (
            cellValue.match(
              /^#?\d+$|number|id|num$|^[a-z]$|assignment|allocation$/
            )
          ) {
            // Look at data rows to see if it has grouping patterns
            // Determine if has header based on header detection patterns
            const hasHeaderRow = firstRow.some((cell) => {
              const val = String(cell || "").toLowerCase();
              return (
                val.includes("name") ||
                val.includes("phone") ||
                val.includes("email") ||
                val.includes("first") ||
                val.includes("last") ||
                val.includes("group") ||
                val.includes("table")
              );
            });

            const dataValues = validRows
              .slice(hasHeaderRow ? 1 : 0, 6)
              .map((row) => (row[i] ? String(row[i]).trim() : ""))
              .filter((val) => val.length > 0);

            if (dataValues.length > 1) {
              const hasRepeats = dataValues.some(
                (val, idx) => dataValues.indexOf(val) !== idx
              );
              if (hasRepeats) {
                groupColumnIndex = i;
                groupType = "pattern";
                break;
              }
            }
          }
        }
      }

      // If no name columns detected, assume first column is name
      if (firstNameIndex === -1 && lastNameIndex === -1 && nameIndex === -1) {
        nameIndex = 0;
      }

      const hasGrouping = groupColumnIndex !== -1;

      columnMapping = {
        firstNameIndex: firstNameIndex === -1 ? null : firstNameIndex,
        lastNameIndex: lastNameIndex === -1 ? null : lastNameIndex,
        nameIndex: nameIndex === -1 ? null : nameIndex,
        phoneIndex: phoneIndex === -1 ? null : phoneIndex,
        emailIndex: emailIndex === -1 ? null : emailIndex,
        hasHeader: firstRow.some((cell) => {
          const val = String(cell || "").toLowerCase();
          return (
            val.includes("name") ||
            val.includes("phone") ||
            val.includes("email") ||
            val.includes("first") ||
            val.includes("last") ||
            val.includes("group") ||
            val.includes("table")
          );
        }),
        groupIndicators: {
          hasGroups: hasGrouping,
          groupColumnIndex: hasGrouping ? groupColumnIndex : null,
          groupType: groupType,
          description: hasGrouping
            ? `Groups detected in column ${groupColumnIndex + 1} (${
                firstRow[groupColumnIndex] || "unnamed"
              })`
            : "No groups detected due to AI parsing error",
          confidence: hasGrouping ? "medium" : undefined,
          tableOptimized: groupType === "table_explicit",
        },
      };
    }

    const {
      firstNameIndex,
      lastNameIndex,
      nameIndex,
      phoneIndex,
      emailIndex,
      hasHeader,
      groupIndicators,
    } = columnMapping;

    // Validate that we have at least one way to get names
    if (
      (firstNameIndex === null ||
        firstNameIndex === undefined ||
        firstNameIndex < 0) &&
      (lastNameIndex === null ||
        lastNameIndex === undefined ||
        lastNameIndex < 0) &&
      (nameIndex === null || nameIndex === undefined || nameIndex < 0)
    ) {
      return NextResponse.json({
        success: false,
        error:
          'Could not identify name columns in the file. Please ensure there are columns for guest names (either "firstName/lastName" or "name").',
      });
    }

    const dataRows = hasHeader ? validRows.slice(1) : validRows;

    // Process guests with enhanced validation
    const processedGuests: ProcessedGuest[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || !Array.isArray(row)) continue;

      let firstName = "";
      let lastName = "";

      // Extract names based on available columns
      if (
        firstNameIndex !== null &&
        firstNameIndex !== undefined &&
        firstNameIndex >= 0 &&
        firstNameIndex < row.length
      ) {
        firstName = String(row[firstNameIndex] || "").trim();
      }

      if (
        lastNameIndex !== null &&
        lastNameIndex !== undefined &&
        lastNameIndex >= 0 &&
        lastNameIndex < row.length
      ) {
        lastName = String(row[lastNameIndex] || "").trim();
      }

      // If no separate firstName/lastName, try to parse from name column
      if (
        !firstName &&
        !lastName &&
        nameIndex !== null &&
        nameIndex !== undefined &&
        nameIndex >= 0 &&
        nameIndex < row.length
      ) {
        const fullName = String(row[nameIndex] || "").trim();
        if (fullName) {
          const nameParts = fullName.split(/\s+/);
          firstName = nameParts[0] || "";
          lastName = nameParts.slice(1).join(" ") || "";
        }
      }

      // Skip if no name data
      if (!firstName && !lastName) continue;

      const guest: ProcessedGuest = {
        firstName: firstName,
        lastName: lastName,
        phoneNumber:
          phoneIndex !== null &&
          phoneIndex !== undefined &&
          phoneIndex >= 0 &&
          phoneIndex < row.length &&
          row[phoneIndex]
            ? String(row[phoneIndex]).trim()
            : undefined,
        email:
          emailIndex !== null &&
          emailIndex !== undefined &&
          emailIndex >= 0 &&
          emailIndex < row.length &&
          row[emailIndex]
            ? String(row[emailIndex]).trim()
            : undefined,
        groupInfo:
          groupIndicators?.hasGroups &&
          groupIndicators?.groupColumnIndex !== null &&
          groupIndicators.groupColumnIndex >= 0 &&
          groupIndicators.groupColumnIndex < row.length &&
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
      // First try simple grouping if we have explicit group data
      const guestsWithGroups = processedGuests.filter(
        (guest) => guest.groupInfo
      );

      if (guestsWithGroups.length > 0) {
        // Simple group creation based on groupInfo
        const groupMap = new Map<string, ProcessedGuest[]>();

        guestsWithGroups.forEach((guest) => {
          const groupId = guest.groupInfo!;
          if (!groupMap.has(groupId)) {
            groupMap.set(groupId, []);
          }
          groupMap.get(groupId)!.push(guest);
        });

        // Create groups from the map
        groupMap.forEach((members, groupId) => {
          if (members.length >= 2) {
            // Only create groups with 2+ members
            const groupName =
              groupIndicators.groupType === "table_explicit"
                ? `Table ${groupId}`
                : `Group ${groupId}`;

            detectedGroups.push({
              id: `group_${groupId}`,
              name: groupName,
              members: members.map((m) => `${m.firstName} ${m.lastName}`),
              suggestedTableSize: Math.min(Math.max(members.length, 4), 8),
              groupType:
                (groupIndicators.groupType as
                  | "table_explicit"
                  | "group_id"
                  | "pattern"
                  | "family"
                  | "corporate"
                  | "plus_one") || "group_id",
              confidence: "high",
              reasoning: `Explicit group assignment: ${groupId}`,
            });
          }
        });
      }

      // If simple grouping worked, skip AI analysis
      if (detectedGroups.length > 0) {
        console.log(
          `Created ${detectedGroups.length} groups using explicit group data`
        );
      } else {
        // Fallback to AI analysis
        try {
          const groupAnalysisPrompt = processedGuests
            .map(
              (guest) =>
                `${guest.firstName} ${guest.lastName}${
                  guest.groupInfo ? ` | ${guest.groupInfo}` : ""
                }`
            )
            .join("\n");

          const groupResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are a specialized table seating optimization AI. Your EXCLUSIVE PURPOSE is to create optimal table groupings for event seating arrangements. Focus on EXPLICIT table identifiers above all else.

CRITICAL: Return ONLY valid JSON array. No explanations, markdown, or additional text.

TABLE GROUPING METHODOLOGY (STRICT PRIORITY ORDER):

1. **HIGHEST PRIORITY - EXPLICIT TABLE/GROUP DATA:**
   If guests have explicit table numbers, group IDs, or party identifiers:
   - Group by exact table number/ID matches
   - Preserve existing table assignments
   - Use provided group codes/IDs as-is
   - HIGH confidence for these groups

2. **MEDIUM PRIORITY - CLEAR NUMERICAL/ALPHABETICAL PATTERNS:**
   For consistent grouping patterns (1,1,1,2,2,2 or A,A,B,B):
   - Group guests with matching identifiers
   - Create tables based on these patterns
   - MEDIUM confidence

3. **LOW PRIORITY - RELATIONSHIP-BASED GROUPING:**
   Only if NO explicit identifiers exist:
   - Same surnames (families at same table)
   - Plus-one indicators (keep companions together)
   - Corporate affiliations (colleagues together)
   - LOW confidence

OPTIMAL TABLE SIZING FOR EVENTS:
- 2-4 guests: Intimate tables (couples, small families)
- 4-6 guests: Standard round tables (most common)
- 6-8 guests: Large round tables (extended groups)
- 8-10 guests: Maximum for conversation flow
- Split groups larger than 10 into multiple tables

TABLE-OPTIMIZED NAMING:
- Explicit tables: "Table [Number]", "Group [ID]", "[Party Name] Table"
- Pattern-based: "Table [X] Group", "Party [ID]"
- Relationship-based: "[Surname] Family Table", "[Company] Table"

JSON STRUCTURE FOR TABLE ASSIGNMENTS:
[
  {
    "id": "table_[number]" | "group_[id]",
    "name": "table_focused_name",
    "members": ["guest_names_exactly_as_provided"],
    "suggestedTableSize": number,
    "groupType": "table_explicit" | "group_id" | "pattern" | "family" | "corporate" | "plus_one",
    "confidence": "high" | "medium" | "low",
    "reasoning": "table_assignment_justification"
  }
]

CRITICAL RULES:
- If explicit table/group data exists, ALWAYS use it with HIGH confidence
- Optimal table sizes: 4-8 guests per table
- Keep existing table assignments intact
- Split oversized groups into multiple tables
- Minimum 2 guests per table group`,
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
