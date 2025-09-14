'use client';

import React from 'react';

interface Rule {
    field: string;
    operator: string;
    value: string | number | [string | number, string | number];
}

interface RuleBuilderProps {
    rules: {
        logic: 'AND' | 'OR';
        conditions: Rule[];
    };
    onChange: (rules: { logic: 'AND' | 'OR'; conditions: Rule[] }) => void;
}

const FIELD_OPTIONS = [
    { value: 'total_spend', label: 'Total Spend', type: 'number' },
    { value: 'total_visits', label: 'Total Visits', type: 'number' },
    { value: 'last_visit_date', label: 'Last Visit Date', type: 'date' },
    { value: 'tags', label: 'Tags', type: 'array' },
    { value: 'first_name', label: 'First Name', type: 'string' },
    { value: 'last_name', label: 'Last Name', type: 'string' },
    { value: 'email', label: 'Email', type: 'string' },
];

const OPERATOR_OPTIONS = {
    number: [
        { value: '=', label: 'Equals' },
        { value: '>', label: 'Greater than' },
        { value: '<', label: 'Less than' },
        { value: '>=', label: 'Greater than or equal' },
        { value: '<=', label: 'Less than or equal' },
        { value: 'between', label: 'Between' },
    ],
    string: [
        { value: '=', label: 'Equals' },
        { value: 'contains', label: 'Contains' },
        { value: 'starts_with', label: 'Starts with' },
        { value: 'ends_with', label: 'Ends with' },
    ],
    array: [
        { value: 'contains', label: 'Contains' },
        { value: 'not_contains', label: 'Does not contain' },
    ],
    date: [
        { value: '=', label: 'On date' },
        { value: '>', label: 'After' },
        { value: '<', label: 'Before' },
        { value: '>=', label: 'On or after' },
        { value: '<=', label: 'On or before' },
        { value: 'between', label: 'Between' },
    ],
};

export default function SegmentRuleBuilder({ rules, onChange }: RuleBuilderProps) {
    const addRule = () => {
        const newRules = {
            ...rules,
            conditions: [
                ...rules.conditions,
                { field: 'total_spend', operator: '>', value: 0 }
            ]
        };
        onChange(newRules);
    };

    const removeRule = (index: number) => {
        const newRules = {
            ...rules,
            conditions: rules.conditions.filter((_, i) => i !== index)
        };
        onChange(newRules);
    };

    const updateRule = (index: number, field: keyof Rule, value: string | number | [string | number, string | number]) => {
        const newConditions = [...rules.conditions];
        
        if (field === 'field') {
            // Reset operator and value when field changes
            const fieldValue = value as string;
            const fieldType = FIELD_OPTIONS.find(f => f.value === fieldValue)?.type || 'string';
            const defaultOperator = OPERATOR_OPTIONS[fieldType as keyof typeof OPERATOR_OPTIONS][0]?.value || '=';
            newConditions[index] = {
                field: fieldValue,
                operator: defaultOperator,
                value: fieldType === 'number' ? 0 : ''
            };
        } else if (field === 'operator') {
            const operatorValue = value as string;
            newConditions[index] = {
                ...newConditions[index],
                operator: operatorValue,
                value: operatorValue === 'between' ? [0, 0] : (typeof newConditions[index].value === 'object' ? 0 : newConditions[index].value)
            };
        } else {
            newConditions[index] = {
                ...newConditions[index],
                [field]: value
            };
        }

        onChange({
            ...rules,
            conditions: newConditions
        });
    };

    const toggleLogic = () => {
        onChange({
            ...rules,
            logic: rules.logic === 'AND' ? 'OR' : 'AND'
        });
    };

    const getFieldType = (fieldValue: string) => {
        return FIELD_OPTIONS.find(f => f.value === fieldValue)?.type || 'string';
    };

    const renderValueInput = (rule: Rule, index: number) => {
        const fieldType = getFieldType(rule.field);

        if (rule.operator === 'between') {
            const values = Array.isArray(rule.value) ? rule.value : [0, 0];
            return (
                <div className="flex items-center space-x-2">
                    <input
                        type={fieldType === 'date' ? 'date' : 'number'}
                        value={values[0]}
                        onChange={(e) => {
                            if (fieldType === 'date') {
                                updateRule(index, 'value', [e.target.value, values[1]]);
                            } else {
                                updateRule(index, 'value', [Number(e.target.value), values[1]]);
                            }
                        }}
                        className="flex-1 px-3 text-black py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Min"
                    />
                    <span className="text-black">to</span>
                    <input
                        type={fieldType === 'date' ? 'date' : 'number'}
                        value={values[1]}
                        onChange={(e) => {
                            if (fieldType === 'date') {
                                updateRule(index, 'value', [values[0], e.target.value]);
                            } else {
                                updateRule(index, 'value', [values[0], Number(e.target.value)]);
                            }
                        }}
                        className="flex-1 px-3 text-black py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Max"
                    />
                </div>
            );
        }

        const inputType = fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text';
        
        return (
            <input
                type={inputType}
                value={rule.value as string | number}
                onChange={(e) => updateRule(index, 'value', 
                    fieldType === 'number' ? Number(e.target.value) : e.target.value
                )}
                className="flex-1 px-3 text-black py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${rule.field.replace('_', ' ')}`}
            />
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Segment Rules</h3>
                <button
                    type="button"
                    onClick={addRule}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Add Rule
                </button>
            </div>

            {rules.conditions.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                        {rules.conditions.map((rule, index) => (
                            <div key={index}>
                                {index > 0 && (
                                    <div className="flex justify-center my-2">
                                        <button
                                            type="button"
                                            onClick={toggleLogic}
                                            className="px-3 py-1 bg-gray-200 text-black rounded-full text-sm hover:bg-gray-300 transition-colors"
                                        >
                                            {rules.logic}
                                        </button>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-12 gap-3 items-center bg-white rounded-lg p-3 border">
                                    {/* Field Selection */}
                                    <div className="col-span-3">
                                        <select
                                            value={rule.field}
                                            onChange={(e) => updateRule(index, 'field', e.target.value)}
                                            className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {FIELD_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Operator Selection */}
                                    <div className="col-span-3">
                                        <select
                                            value={rule.operator}
                                            onChange={(e) => updateRule(index, 'operator', e.target.value)}
                                            className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {OPERATOR_OPTIONS[getFieldType(rule.field) as keyof typeof OPERATOR_OPTIONS]?.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Value Input */}
                                    <div className="col-span-5">
                                        {renderValueInput(rule, index)}
                                    </div>

                                    {/* Remove Button */}
                                    <div className="col-span-1 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeRule(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            disabled={rules.conditions.length === 1}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {rules.conditions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>No rules defined. Click &quot;Add Rule&quot; to get started.</p>
                </div>
            )}
        </div>
    );
}
