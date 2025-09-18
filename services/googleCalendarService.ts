import { Task, TaskStatus } from "../types";

// This is a MOCKED service. In a real application, this would use the Google Calendar API
// with proper OAuth2 authentication on a backend server.

export const syncCalendar = async (): Promise<Partial<Task>[]> => {
    console.log("SYNC: Fetching events from Google Calendar...");
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    // Return a list of mock events
    const mockEvents: Partial<Task>[] = [
        {
            title: "Client Proposal Review",
            category: "Meeting",
            startTime: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
            plannedDuration: 60,
            googleCalendarEventId: "gcal-mock-1",
            isVirtual: true,
            linkedUrl: "https://meet.google.com/mock-link"
        },
        {
            title: "Dentist Appointment",
            category: "Meeting",
            startTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
            plannedDuration: 45,
            googleCalendarEventId: "gcal-mock-2",
            location: "123 Smile Street, San Francisco, CA"
        }
    ];
    
    console.log("SYNC: Found mock events:", mockEvents);
    return mockEvents;
};

export const addEventToCalendar = (task: Task): void => {
    // In a real app, this would make an API call to create a new event.
    console.log(`SYNC: Pushing new event to Google Calendar: "${task.title}"`);
};

export const updateEventInCalendar = (task: Task): void => {
    // In a real app, this would make an API call to update an existing event.
    console.log(`SYNC: Updating event in Google Calendar: "${task.title}"`);
};