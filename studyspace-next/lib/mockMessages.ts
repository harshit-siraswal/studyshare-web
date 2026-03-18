export type MockMessageStatus = "sent" | "delivered" | "read";

export interface MockMessage {
  id: number;
  content: string;
  sender: "me" | "other";
  time: string;
  status: MockMessageStatus;
}

export interface MockChat {
  id: string;
  name: string;
  username: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

export const mockChats: MockChat[] = [
  {
    id: "rahul_k_2024",
    name: "Rahul K.",
    username: "rahul_k_2024",
    lastMessage: "Hey, did you complete the assignment?",
    time: "2m",
    unread: 2,
    online: true,
  },
  {
    id: "prof_sharma_cs",
    name: "Prof. Sharma",
    username: "prof_sharma_cs",
    lastMessage: "The deadline is extended",
    time: "1h",
    unread: 0,
    online: false,
  },
  {
    id: "priya_m_tech",
    name: "Priya M.",
    username: "priya_m_tech",
    lastMessage: "Thanks for the notes!",
    time: "3h",
    unread: 0,
    online: true,
  },
  {
    id: "amit_bits",
    name: "Amit S.",
    username: "amit_bits",
    lastMessage: "Let's study together tomorrow",
    time: "1d",
    unread: 0,
    online: false,
  },
  {
    id: "vikram_r_24",
    name: "Vikram R.",
    username: "vikram_r_24",
    lastMessage: "Check out this video",
    time: "2d",
    unread: 1,
    online: false,
  },
];

export const mockMessages: Record<string, MockMessage[]> = {
  rahul_k_2024: [
    { id: 1, content: "Hey! How's it going?", sender: "other", time: "10:00 AM", status: "read" },
    { id: 2, content: "Good! Working on the DBMS project", sender: "me", time: "10:02 AM", status: "read" },
    { id: 3, content: "Nice! Need any help?", sender: "other", time: "10:03 AM", status: "read" },
    { id: 4, content: "Actually yes, can you explain normalization?", sender: "me", time: "10:05 AM", status: "read" },
    { id: 5, content: "Sure! Let me send you some notes", sender: "other", time: "10:06 AM", status: "read" },
    { id: 6, content: "Hey, did you complete the assignment?", sender: "other", time: "10:30 AM", status: "delivered" },
  ],
  prof_sharma_cs: [
    { id: 1, content: "Sir, regarding the assignment deadline", sender: "me", time: "9:00 AM", status: "read" },
    { id: 2, content: "Yes, what about it?", sender: "other", time: "9:30 AM", status: "read" },
    { id: 3, content: "Can we get an extension?", sender: "me", time: "9:31 AM", status: "read" },
    { id: 4, content: "The deadline is extended", sender: "other", time: "9:45 AM", status: "read" },
  ],
  priya_m_tech: [
    { id: 1, content: "Hi! Do you have the OS notes?", sender: "other", time: "Yesterday", status: "read" },
    { id: 2, content: "Yes, I'll share them", sender: "me", time: "Yesterday", status: "read" },
    { id: 3, content: "Thanks for the notes!", sender: "other", time: "Yesterday", status: "read" },
  ],
};
