'use client'

import { useState } from 'react';

// A simple accordion component for the FAQs
function AccordionItem({ title, children }: { title: string, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-4 text-left font-semibold"
            >
                <span>{title}</span>
                <i className={`fas fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 py-4' : 'max-h-0'}`}>
                <div className="text-gray-600">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function HelpPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">Help & Support</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions (FAQs)</h2>
                        
                        <AccordionItem title="How do I add a new property?">
                            <p>As a landlord, you can add a new property by navigating to the "Properties" page from your dashboard and clicking the "+ Add New Property" button. You will be guided through a form to enter all the necessary details.</p>
                        </AccordionItem>
                        
                        <AccordionItem title="How does the landlord verification work?">
                            <p>To build trust, landlords can get verified by submitting a valid ID and proof of property ownership on the "Settings" page. Our team will review the documents, and a "Verified" badge will be added to your profile and listings upon approval.</p>
                        </AccordionItem>

                        <AccordionItem title="How do I apply for a property?">
                            <p>As a renter, you can browse listings on the "Find Properties" page. When you find a property you're interested in, click on it to view the details and then use the "Apply & Message Landlord" button to submit your application.</p>
                        </AccordionItem>

                        <AccordionItem title="How are payments handled?">
                            <p>For Version 1.0, all payments (rent, caution fees, etc.) are handled directly between the landlord and the tenant outside of the platform. Landlords can then use the "Payments" module to manually record these transactions for their records.</p>
                        </AccordionItem>
                    </div>
                </div>
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
                        <p className="text-sm text-gray-600">If you can't find the answer you're looking for, please feel free to reach out to our support team.</p>
                        <div className="mt-4 space-y-3">
                            <p className="flex items-center text-sm">
                                <i className="fas fa-envelope text-teal-600 mr-2"></i>
                                support@ogalandlord.ng
                            </p>
                            <p className="flex items-center text-sm">
                                <i className="fas fa-phone text-teal-600 mr-2"></i>
                                +234 800 123 4567
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}