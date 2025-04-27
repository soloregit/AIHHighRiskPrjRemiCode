import React, { useState } from "react";

// Define the survey data types
export interface SurveyData {
    mood: number;
    satisfied: number;
    perception: number;
    timestamp: Date;
}

export interface SessionSurveyModalProps {
    isOpen: boolean;
    isPreSession: boolean;
    onComplete: (surveyData: SurveyData) => void;
    onCancel?: () => void;
}

export const SessionSurveyModal: React.FC<SessionSurveyModalProps> = ({
    isOpen,
    isPreSession,
    onComplete,
}) => {
    const [mood, setMood] = useState<number>(50);
    const [satisfied, setSatisfied] = useState<number>(4);
    const [perception, setPerception] = useState<number>(4);

    if (!isOpen) return null;

    const getMoodEmoji = (): string => {
        if (mood < 33) return "😞";
        if (mood < 66) return "😐";
        return "😊";
    };

    const getMoodText = (): string => {
        if (mood < 20) return "Very Low";
        if (mood < 40) return "Low";
        if (mood < 70) return "Neutral";
        return "Excellent";
    };

    const getMoodPercentage = (): string => {
        return `(${Math.round(mood)}%)`;
    };

    // const getSatisfiedText = (): string => {
    //     if (satisfied < 33) return "Dissatisfied";
    //     if (satisfied < 66) return "Neutral";
    //     return "Satisfied";
    // };

    // const getPerceptionText = (): string => {
    //     if (perception < 3) return "Harmful";
    //     if (perception < 5) return "Neutral";
    //     return "Beneficial";
    // };

    const handleSubmit = (): void => {
        onComplete({
            mood,
            satisfied,
            perception,
            timestamp: new Date()
        });
    };

    const renderStars = (stateFunc: (num: number) => void, stateVar: number) => {
        const stars = [];
        for (let i = 1; i <= 7; i++) {
            stars.push(
                <button
                    key={i}
                    type="button"
                    onClick={() => stateFunc(i)}
                    className="focus:outline-none"
                >
                    <svg
                        className={`w-8 h-8 ${i <= stateVar ? 'text-blue-500 fill-blue-500' : 'text-gray-300 fill-gray-300'}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </button>
            );
        }
        return stars;
    };

    const title = isPreSession ? "Pre-Session Check" : "Post-Session Check";
    const promptText = isPreSession
        ? "Please let us know how you're feeling before the session"
        : "Please let us know how you're feeling after the session";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
            <div className="bg-white rounded-lg py-4 px-8 w-full max-w-lg">
                <div className="flex flex-col items-center overflow-hidden">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                        <img src="/remibot/avatar.png" alt="Remi" className="w-full h-full object-cover" />
                    </div>

                    <h2 className="text-3xl font-semibold text-gray-700 mb-6">{title}</h2>

                    <div className="flex flex-col w-full space-y-10 overflow-auto">
                        {/* Mood Slider */}
                        <div className="text-center">
                            <p className="text-lg font-medium mb-4 text-amber-900">{promptText}</p>
                            <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-4xl">{getMoodEmoji()}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={mood}
                                onChange={(e) => setMood(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between mt-2 text-gray-600">
                                <span>Very Low</span>
                                <span>Neutral</span>
                                <span>Excellent</span>
                            </div>
                            <p className="mt-2 text-lg font-medium">{getMoodText()} {getMoodPercentage()}</p>
                        </div>

                        {/* Perception Slider */}
                        <div className="text-center">
                            <p className="text-lg font-medium mb-4 text-amber-900">All things considered, I think using AI Therapy for emotional well-being is:</p>
                            <div className="flex justify-center space-x-2 mb-4">
                                {renderStars(setPerception, perception)}
                            </div>
                            <div className="flex justify-between mt-2 text-gray-600 mx-12">
                                <span>Harmful</span>
                                <span>Beneficial</span>
                            </div>
                            {/* <p className="mt-2 text-lg font-medium">{getPerceptionText()}</p> */}
                        </div>

                        {!isPreSession && (
                            <div className="text-center">
                                <p className="text-lg font-medium mb-4 text-amber-900">How satisfied were you with this AI therapy session?</p>
                                <div className="flex justify-center space-x-2 mb-4">
                                    {renderStars(setSatisfied, satisfied)}
                                </div>
                                <div className="flex justify-between mt-2 text-gray-600 mx-12">
                                    <span>Very Dissatisfied</span>
                                    <span>Very Satisifed</span>
                                </div>
                                {/* <p className="mt-2 text-lg font-medium">{getSatisfiedText()}</p> */}
                            </div>)}

                        <button
                            onClick={handleSubmit}
                            className="w-full py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionSurveyModal;