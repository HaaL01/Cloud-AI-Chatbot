import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await axios.post(`${API_URL}/api/generate`, {
      ...body,
      stream: true
    }, {
      responseType: 'stream'
    });

    const stream = new ReadableStream({
      start(controller) {
        response.data.on('data', (chunk: Buffer) => {
          // Parse the chunk and format it as an SSE message
          const text = chunk.toString();
          controller.enqueue(new TextEncoder().encode(`data: ${text}\n\n`));
        });

        response.data.on('end', () => {
          controller.close();
        });

        response.data.on('error', (err: Error) => {
          console.error('Stream Error:', err);
          controller.error(err);
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Ollama' },
      { status: 500 }
    );
  }
}