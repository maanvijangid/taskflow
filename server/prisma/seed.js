import { PrismaClient, Priority, Stage, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Create demo users
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user1 = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            email: 'demo@example.com',
            name: 'Demo User',
            password: hashedPassword,
            profilePic: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff',
        },
    });
    const user2 = await prisma.user.upsert({
        where: { email: 'john@example.com' },
        update: {},
        create: {
            email: 'john@example.com',
            name: 'John Doe',
            password: hashedPassword,
            profilePic: 'https://ui-avatars.com/api/?name=John+Doe&background=10b981&color=fff',
        },
    });
    const user3 = await prisma.user.upsert({
        where: { email: 'jane@example.com' },
        update: {},
        create: {
            email: 'jane@example.com',
            name: 'Jane Smith',
            password: hashedPassword,
            profilePic: 'https://ui-avatars.com/api/?name=Jane+Smith&background=f59e0b&color=fff',
        },
    });
    console.log('✅ Created users:', user1.email, user2.email, user3.email);
    // Create sample tasks
    const tasks = [
        {
            title: 'Set up project documentation',
            description: 'Create comprehensive README and API documentation for the project',
            priority: Priority.HIGH,
            stage: Stage.TODO,
            userId: user1.id,
            assigneeId: user2.id,
            assigneeEmail: user2.email,
        },
        {
            title: 'Implement user authentication',
            description: 'Add Google OAuth and email/password authentication',
            priority: Priority.HIGH,
            stage: Stage.COMPLETED,
            userId: user1.id,
        },
        {
            title: 'Design dashboard UI',
            description: 'Create modern, responsive dashboard with charts and statistics',
            priority: Priority.MEDIUM,
            stage: Stage.IN_PROGRESS,
            userId: user1.id,
            assigneeId: user3.id,
            assigneeEmail: user3.email,
        },
        {
            title: 'Write unit tests',
            description: 'Add comprehensive test coverage for core functionality',
            priority: Priority.MEDIUM,
            stage: Stage.TODO,
            userId: user2.id,
            assigneeId: user1.id,
            assigneeEmail: user1.email,
        },
        {
            title: 'Deploy to production',
            description: 'Set up CI/CD pipeline and deploy to cloud hosting',
            priority: Priority.NORMAL,
            stage: Stage.TODO,
            userId: user1.id,
        },
        {
            title: 'Code review pending PRs',
            description: 'Review and merge pending pull requests',
            priority: Priority.LOW,
            stage: Stage.IN_PROGRESS,
            userId: user3.id,
            assigneeId: user2.id,
            assigneeEmail: user2.email,
        },
    ];
    for (const taskData of tasks) {
        const task = await prisma.task.create({
            data: {
                ...taskData,
                activities: {
                    create: {
                        type: ActivityType.CREATED,
                        description: 'Task created',
                        userId: taskData.userId,
                    },
                },
                subTasks: {
                    create: [
                        { title: 'Research requirements', isCompleted: true },
                        { title: 'Implementation', isCompleted: false },
                        { title: 'Testing', isCompleted: false },
                    ],
                },
            },
        });
        console.log('✅ Created task:', task.title);
    }
    console.log('🎉 Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map