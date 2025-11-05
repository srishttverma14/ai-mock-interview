import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import connectToDB from '@/lib/db';
import Interview from '@/lib/models/interview.model';

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDB();

        const interviews = await Interview.find({ userId: user.id }).sort({ createdAt: -1 });

        return NextResponse.json(interviews, { status: 200 });

    } catch (error) {
        console.error('Error fetching interview history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
