import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/utils/db';

export async function POST(request: NextRequest) {
  try {
    const { title, userId, messages } = await request.json();
    const pool = getPool();

    // Create new chat
    const chatResult = await pool.query(
      'INSERT INTO chats (user_id, title, timestamp) VALUES ($1, $2, NOW()) RETURNING id, timestamp',
      [userId, title]
    );

    const chatId = chatResult.rows[0].id;

    // Insert messages if any
    if (messages && messages.length > 0) {
      for (const message of messages) {
        await pool.query(
          'INSERT INTO messages (chat_id, content, is_user, timestamp) VALUES ($1, $2, $3, $4)',
          [chatId, message.content, message.isUser, message.timestamp]
        );
      }
    }

    return NextResponse.json({
      id: chatId,
      title,
      timestamp: chatResult.rows[0].timestamp,
      messages: messages || []
    });
  } catch (error) {
    console.error('Failed to create chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Get all chats for the user
    const chatsResult = await pool.query(
      'SELECT id, title, timestamp FROM chats WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    );

    // Get messages for all chats
    const chats = await Promise.all(
      chatsResult.rows.map(async (chat) => {
        const messagesResult = await pool.query(
          'SELECT id, content, is_user, timestamp FROM messages WHERE chat_id = $1 ORDER BY timestamp ASC',
          [chat.id]
        );

        return {
          ...chat,
          messages: messagesResult.rows.map(msg => ({
            id: msg.id,
            content: msg.content,
            isUser: msg.is_user,
            timestamp: msg.timestamp
          }))
        };
      })
    );

    return NextResponse.json(chats);

  } catch (error) {
    console.error('Failed to fetch chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}