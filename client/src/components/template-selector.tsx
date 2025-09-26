/**
 * Template Selector Component
 * Allows users to select industry-specific bot flow templates
 */

import React, { useState } from 'react';
import { X, Check, Star, Users, Clock, CreditCard } from 'lucide-react';
import { industryTemplates, IndustryTemplate } from '../../../shared/templates/industry-templates';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: IndustryTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<IndustryTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  if (!isOpen) return null;

  const handleSelectTemplate = (template: IndustryTemplate) => {
    setSelectedTemplate(template);
    setPreviewMode(true);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  const handleBackToSelection = () => {
    setPreviewMode(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {previewMode ? 'Template Preview' : 'Choose Industry Template'}
            </h2>
            <p className="text-gray-600 mt-1">
              {previewMode 
                ? 'Review the template before applying it to your bot flow'
                : 'Select a pre-built template for your industry to get started quickly'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!previewMode ? (
            /* Template Selection */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {industryTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{template.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {template.name}
                      </h3>
                      <p className="text-gray-600 mb-4">{template.description}</p>
                      
                      {/* Features */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                        <div className="flex flex-wrap gap-2">
                          {template.features.map((feature, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Use Cases */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Perfect for:</h4>
                        <div className="flex flex-wrap gap-2">
                          {template.useCases.map((useCase, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {useCase}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Template Preview */
            selectedTemplate && (
              <div className="space-y-6">
                {/* Template Header */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-4xl">{selectedTemplate.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-gray-600">{selectedTemplate.description}</p>
                  </div>
                </div>

                {/* Flow Preview */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Bot Flow Preview</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex space-x-4 overflow-x-auto pb-4">
                      {selectedTemplate.flow.nodes.map((node, index) => (
                        <div
                          key={node.id}
                          className="flex-shrink-0 w-48 bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">
                              Step {index + 1}
                            </span>
                          </div>
                          <h5 className="font-semibold text-gray-900 mb-1">{node.name}</h5>
                          <p className="text-sm text-gray-600">
                            {node.type === 'service_message' && 'Welcome message with services'}
                            {node.type === 'date_picker' && 'Date selection'}
                            {node.type === 'time_slots' && 'Time slot selection'}
                            {node.type === 'booking_summary' && 'Booking confirmation'}
                            {node.type === 'question' && 'User input collection'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Included Features</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTemplate.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check size={16} className="text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Perfect For</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.useCases.map((useCase, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleBackToSelection}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Back to Selection
                  </button>
                  <button
                    onClick={handleConfirmSelection}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Check size={16} />
                    <span>Use This Template</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
