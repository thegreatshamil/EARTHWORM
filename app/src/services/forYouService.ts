const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ForYouFieldProfile {
    name: string;
    location: string;
    size_acres: number;
    crops: string[];
    soil_type?: string;
    irrigation?: string;
}

export interface ForYouRequestPayload {
    text: string;
    session_id: string;
    language: string;
    field_profile: ForYouFieldProfile;
}

interface ForYouResponse {
    response: string;
}

class ForYouService {
    async sendInsight(payload: ForYouRequestPayload): Promise<string> {
        try {
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
        } catch (error) {
            console.error('For You API error:', error);
            throw error;
        }
    }
}

export const forYouService = new ForYouService();
export default forYouService;
