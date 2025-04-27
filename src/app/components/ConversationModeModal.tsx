import React from "react";

interface ConversationModeModalProps {
    isOpen: boolean;
    onSelectMode: (mode: 'text' | 'voice') => void;
}

export const ConversationModeModal: React.FC<ConversationModeModalProps> = ({
    isOpen,
    onSelectMode
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-2">
                        <img src="/remibot/avatar.png" alt="Remi" className="w-full h-full object-cover" />
                    </div>

                    <h2 className="text-3xl font-semibold text-gray-700 mb-2">Choose a Conversation Mode</h2>
                    <p className="text-xl text-gray-600 mb-8">Select how you&apos;d like to interact with Remi</p>

                    <div className="w-full space-y-4">
                        {/* Text Chat Option */}
                        <button
                            onClick={() => onSelectMode('text')}
                            className="w-full border-2 border-gray-300 rounded-lg p-4 flex items-center hover:bg-gray-100 hover:border-blue-400 transition-colors"
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 9H16M8 13H14M18 15L21 18M3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H7L3 19Z" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <h3 className="text-2xl font-medium">Text Chat</h3>
                                <p className="text-gray-600">Type messages to communicate with Remi</p>
                            </div>
                        </button>

                        {/* Voice Chat Option */}
                        <button
                            onClick={() => onSelectMode('voice')}
                            className="w-full border-2 border-gray-300 rounded-lg p-4 flex items-center hover:bg-gray-100 hover:border-blue-400 transition-colors"
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <h3 className="text-2xl font-medium">Voice Chat</h3>
                                <p className="text-gray-600">Speak and listen for a natural conversation</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConversationModeModal;