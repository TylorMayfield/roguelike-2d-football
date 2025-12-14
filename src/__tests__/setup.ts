// Jest setup file
// Add any global test setup here

// Mock window.electronAPI for tests
(global as any).window = {
    electronAPI: {
        queryDb: jest.fn().mockResolvedValue([]),
    },
};

// Mock document for non-DOM tests
(global as any).document = {
    getElementById: jest.fn().mockReturnValue(null),
    body: {
        appendChild: jest.fn(),
    },
};
