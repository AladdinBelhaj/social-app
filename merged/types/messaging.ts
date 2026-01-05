export interface MessageUser {
    id: number;
    username: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
    id: number;
    participant_1_id: number;
    participant_2_id: number;
    created_at: string;
    participant_1: MessageUser;
    participant_2: MessageUser;
    last_message?: Message;
}

export interface MessagingStatus {
    ws_status: 'connected' | 'disconnected' | 'connecting' | 'error';
    online_users: number[];
}
