type SlackMessagePayload = {
    message: string;
    module: string;
    filename: string;
    status: boolean;
};
export declare function sendSlackMessage(payload: SlackMessagePayload): Promise<void>;
export {};
