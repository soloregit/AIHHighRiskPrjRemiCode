import axios from 'axios';

const API_URL = "https://a-conect-auth.netlify.app/.netlify/functions";

const apiService = {
    getRemiOAKey: async (apiKey: string): Promise<any> => {
        try {
            const response = await axios.get(`${API_URL}/remi_oakey`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            });

            if (response.data && response.data.api_key) {
                return response.data;
            }
            return undefined;
        } catch (error) {
            console.error(`Failed to verify API key. Error: ${error}`);
            return undefined;
        }
    },
    getSession: async (oaKey: string): Promise<any> => {
        try {
            const response = await axios.post(
                "https://api.openai.com/v1/realtime/sessions",
                {
                    model: "gpt-4o-realtime-preview-2024-12-17",
                },
                {
                    headers: {
                        Authorization: `Bearer ${oaKey}`,
                        "Content-Type": "application/json",
                    },
                });
            if (response && response.data) {
                return response.data;
            }
            return undefined;
        } catch (error) {
            console.error(`Failed to fetch session. Error: ${error}`);
            return undefined;
        }
    }
};

export default apiService;
