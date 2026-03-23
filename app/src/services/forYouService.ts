import type { ForYouRequest, ForYouResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ForYouService {
    async sendInsight(payload: ForYouRequest): Promise<string> {
        // TODO: Point this endpoint to your n8n "For You" workflow when ready
        const response = await fetch(`${API_BASE_URL}/for-you`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data: ForYouResponse = await response.json();
        return data.response;
    }
}

export const forYouService = new ForYouService();
export default forYouService;
