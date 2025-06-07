import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { eventService, guestService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { OpenAI } from "openai";

const openai = new OpenAI();

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
      return NextResponse.json({ success: false, error: "No file uploaded." });
    }

    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: "Event ID is required. Please select an event first.",
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let workbook;
    if (file.name.endsWith(".csv")) {
      const fileContent = buffer.toString("utf8");
      workbook = XLSX.read(fileContent, { type: "string" });
    } else {
      workbook = XLSX.read(buffer, { type: "buffer" });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      return NextResponse.json({ success: false, error: "File is empty." });
    }

    // Take header and first few data rows for analysis
    const sampleData = jsonData
      .slice(0, 5)
      .map((row) => row.join(","))
      .join("\n");

    let aiResponse;
    try {
      aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a data parsing assistant. You will be given a sample of CSV-like data from a spreadsheet. Your task is to identify the column index for "name" and "phoneNumber". Also, determine if the first row is a header. Return a JSON object with keys "nameIndex", "phoneIndex", and "hasHeader" (boolean). If a column for phone numbers is not found, its index should be null. Indexes are 0-based. The name column is mandatory.`,
          },
          {
            role: "user",
            content: `Here is the data sample:\n${sampleData}`,
          },
        ],
      });
    } catch (e) {
      if (e instanceof OpenAI.APIError) {
        if (e.status === 401) {
          return NextResponse.json({
            success: false,
            error:
              "OpenAI API key is invalid or missing. Please check your .env file.",
          });
        }
        return NextResponse.json({
          success: false,
          error: `AI service error: ${e.message}`,
        });
      }
      return NextResponse.json({
        success: false,
        error: "An unexpected error occurred with the AI service.",
      });
    }

    let columnMapping;
    try {
      columnMapping = JSON.parse(aiResponse.choices[0].message.content || "{}");
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return NextResponse.json({
        success: false,
        error: "AI failed to parse file structure.",
      });
    }

    const { nameIndex, phoneIndex, hasHeader } = columnMapping;

    if (nameIndex === null || nameIndex === undefined) {
      return NextResponse.json({
        success: false,
        error:
          'AI could not identify the "name" column in the file. Please ensure there is a column for guest names.',
      });
    }

    const dataRows = hasHeader ? jsonData.slice(1) : jsonData;

    const guests = dataRows
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row: any) =>
          row && row[nameIndex] && String(row[nameIndex]).trim() !== ""
      ) // Ensure row and name column exist and is not empty
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => ({
        name: String(row[nameIndex]).trim(),
        phoneNumber:
          phoneIndex !== null && phoneIndex !== undefined && row[phoneIndex]
            ? String(row[phoneIndex]).trim()
            : undefined,
        eventId: eventId,
      }));

    if (guests.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid guest data found in the file.",
      });
    }

    // Import guests using Firestore bulk create
    const batchSize = 25;
    const successfulGuests: { name: string; phoneNumber?: string }[] = [];

    for (let i = 0; i < guests.length; i += batchSize) {
      const batch = guests.slice(i, i + batchSize);
      try {
        await guestService.bulkCreate(userId, batch);
        successfulGuests.push(...batch);
      } catch (e) {
        console.error(
          `Error inserting batch ${Math.floor(i / batchSize) + 1}:`,
          e
        );
        // Try individual creates for this batch
        for (const guest of batch) {
          try {
            await guestService.create(userId, guest);
            successfulGuests.push(guest);
          } catch (individualError) {
            console.error(
              `Failed to create guest ${guest.name}:`,
              individualError
            );
          }
        }
      }
    }

    if (successfulGuests.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Failed to import any guests to the database.",
      });
    }

    return NextResponse.json({
      success: true,
      importedGuests: successfulGuests,
      message: `Successfully imported ${successfulGuests.length} out of ${guests.length} guests.`,
    });
  } catch (error) {
    console.error("Full error object:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({
      success: false,
      error: `Failed to import guests. Details: ${errorMessage}`,
    });
  }
}
