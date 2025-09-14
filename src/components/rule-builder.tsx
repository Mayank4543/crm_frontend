'use client';

import React from 'react';

// Types
interface Condition {
    id: string;
    field: string;
    operation: string;
    value: string | number | boolean;
}

interface ConditionGroup {
    id: string;
    operator: 'AND' | 'OR';
    conditions: (Condition | ConditionGroup)[];
}

export type Rule = ConditionGroup;

interface RuleBuilderProps {
    value: Rule;
    onChange: (rule: Rule) => void;
    onPreview?: () => void;
}

// Available fields and operations
const FIELDS = [
    { value: 'email', label: 'Email' },
    { value: 'total_spend', label: 'Total Spend' },
    { value: 'total_visits', label: 'Total Visits' },
    { value: 'last_visit_date', label: 'Last Visit Date' },
    { value: 'tags', label: 'Tags' },
];

const OPERATIONS = {
    string: [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not Equals' },
        { value: 'contains', label: 'Contains' },
        { value: 'notContains', label: 'Not Contains' },
        { value: 'isEmpty', label: 'Is Empty' },
        { value: 'isNotEmpty', label: 'Is Not Empty' },
    ],
    number: [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not Equals' },
        { value: 'greaterThan', label: 'Greater Than' },
        { value: 'lessThan', label: 'Less Than' },
        { value: 'isEmpty', label: 'Is Empty' },
        { value: 'isNotEmpty', label: 'Is Not Empty' },
    ],
    date: [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not Equals' },
        { value: 'greaterThan', label: 'After' },
        { value: 'lessThan', label: 'Before' },
        { value: 'isEmpty', label: 'Is Empty' },
        { value: 'isNotEmpty', label: 'Is Not Empty' },
    ],
    array: [
        { value: 'contains', label: 'Contains' },
        { value: 'notContains', label: 'Not Contains' },
        { value: 'isEmpty', label: 'Is Empty' },
        { value: 'isNotEmpty', label: 'Is Not Empty' },
    ],
};

// Helper function to get field type
const getFieldType = (field: string): 'string' | 'number' | 'date' | 'array' => {
    switch (field) {
        case 'total_spend':
        case 'total_visits':
            return 'number';
        case 'last_visit_date':
            return 'date';
        case 'tags':
            return 'array';
        default:
            return 'string';
    }
};

// Helper to generate unique IDs
const generateId = (): string => Math.random().toString(36).substring(2, 11);

// Rule Builder Component
export default function RuleBuilder({ value, onChange, onPreview }: RuleBuilderProps) {
    // Handle adding a condition
    const handleAddCondition = (groupId: string) => {
        const updateGroup = (group: ConditionGroup): ConditionGroup => {
            if (group.id === groupId) {
                return {
                    ...group,
                    conditions: [
                        ...group.conditions,
                        {
                            id: generateId(),
                            field: 'total_spend',
                            operation: 'greaterThan',
                            value: 0,
                        },
                    ],
                };
            }

            return {
                ...group,
                conditions: group.conditions.map((condition) => {
                    if ('operator' in condition) {
                        return updateGroup(condition);
                    }
                    return condition;
                }),
            };
        };

        onChange(updateGroup(value));
    };

    // Handle adding a group
    const handleAddGroup = (parentGroupId: string) => {
        const updateGroup = (group: ConditionGroup): ConditionGroup => {
            if (group.id === parentGroupId) {
                return {
                    ...group,
                    conditions: [
                        ...group.conditions,
                        {
                            id: generateId(),
                            operator: 'AND',
                            conditions: [
                                {
                                    id: generateId(),
                                    field: 'total_spend',
                                    operation: 'greaterThan',
                                    value: 0,
                                },
                            ],
                        },
                    ],
                };
            }

            return {
                ...group,
                conditions: group.conditions.map((condition) => {
                    if ('operator' in condition) {
                        return updateGroup(condition);
                    }
                    return condition;
                }),
            };
        };

        onChange(updateGroup(value));
    };

    // Handle removing a condition or group
    const handleRemove = (groupId: string, itemId: string) => {
        const updateGroup = (group: ConditionGroup): ConditionGroup => {
            if (group.id === groupId) {
                return {
                    ...group,
                    conditions: group.conditions.filter((condition) => condition.id !== itemId),
                };
            }

            return {
                ...group,
                conditions: group.conditions.map((condition) => {
                    if ('operator' in condition) {
                        return updateGroup(condition);
                    }
                    return condition;
                }),
            };
        };

        onChange(updateGroup(value));
    };

    // Handle changing operator
    const handleOperatorChange = (groupId: string, newOperator: 'AND' | 'OR') => {
        const updateGroup = (group: ConditionGroup): ConditionGroup => {
            if (group.id === groupId) {
                return {
                    ...group,
                    operator: newOperator,
                };
            }

            return {
                ...group,
                conditions: group.conditions.map((condition) => {
                    if ('operator' in condition) {
                        return updateGroup(condition);
                    }
                    return condition;
                }),
            };
        };

        onChange(updateGroup(value));
    };

    // Handle updating a condition
    const handleConditionChange = (
        groupId: string,
        conditionId: string,
        field: string,
        paramValue: string | number | boolean
    ) => {
        const updateGroup = (group: ConditionGroup): ConditionGroup => {
            if (group.id === groupId) {
                return {
                    ...group,
                    conditions: group.conditions.map((condition) => {
                        if (condition.id === conditionId && !('operator' in condition)) {
                            return {
                                ...condition,
                                [field]: paramValue,
                                // Reset value if field type changes
                                ...(field === 'field' && {
                                    operation: OPERATIONS[getFieldType(paramValue as string)][0].value,
                                    value:
                                        getFieldType(paramValue as string) === 'number'
                                            ? 0
                                            : getFieldType(paramValue as string) === 'date'
                                                ? new Date().toISOString().slice(0, 10)
                                                : '',
                                }),
                                // Reset value if operation requires no value
                                ...(field === 'operation' &&
                                    (paramValue === 'isEmpty' || paramValue === 'isNotEmpty') && {
                                    value: '',
                                }),
                            };
                        }
                        if ('operator' in condition) {
                            return updateGroup(condition);
                        }
                        return condition;
                    }),
                };
            }

            return {
                ...group,
                conditions: group.conditions.map((condition) => {
                    if ('operator' in condition) {
                        return updateGroup(condition);
                    }
                    return condition;
                }),
            };
        };

        onChange(updateGroup(value));
    };

    // Render a condition group
    const renderGroup = (group: ConditionGroup, depth = 0) => {
        return (
            <div
                className={`p-6 rounded-2xl border ${
                    depth === 0 
                        ? 'border-white/20 bg-white/10 backdrop-blur-sm' 
                        : 'border-white/10 bg-white/5 backdrop-blur-sm'
                } mb-4 shadow-lg`}
            >
                <div className="flex items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <select
                                value={group.operator}
                                onChange={(e) => handleOperatorChange(group.id, e.target.value as 'AND' | 'OR')}
                                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 px-4 py-2 pr-8 appearance-none"
                            >
                                <option value="AND" className="bg-gray-800 text-white">AND</option>
                                <option value="OR" className="bg-gray-800 text-white">OR</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex items-center text-sm text-gray-300">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                                group.operator === 'AND' ? 'bg-blue-400' : 'bg-purple-400'
                            }`}></div>
                            <span>
                                {group.operator === 'AND'
                                    ? 'All conditions must match'
                                    : 'Any condition may match'}
                            </span>
                        </div>
                    </div>

                    {depth > 0 && (
                        <button
                            type="button"
                            onClick={() => handleRemove(group.id, group.id)}
                            className="ml-auto p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {group.conditions.map((condition) => {
                        if ('operator' in condition) {
                            return renderGroup(condition, depth + 1);
                        }

                        return renderCondition(group.id, condition);
                    })}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => handleAddCondition(group.id)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Condition
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddGroup(group.id)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Add Group
                    </button>
                </div>
            </div>
        );
    };

    // Render a condition
    const renderCondition = (groupId: string, condition: Condition) => {
        const fieldType = getFieldType(condition.field);
        const operations = OPERATIONS[fieldType];
        const needsValue = condition.operation !== 'isEmpty' && condition.operation !== 'isNotEmpty';

        return (
            <div key={condition.id} className="flex flex-wrap gap-3 items-center p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative min-w-0 flex-shrink-0">
                            <select
                                value={condition.field}
                                onChange={(e) =>
                                    handleConditionChange(groupId, condition.id, 'field', e.target.value)
                                }
                                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 px-4 py-2 pr-8 appearance-none min-w-0 text-sm"
                            >
                                {FIELDS.map((field) => (
                                    <option key={field.value} value={field.value} className="bg-gray-800 text-white">
                                        {field.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <div className="relative min-w-0 flex-shrink-0">
                            <select
                                value={condition.operation}
                                onChange={(e) =>
                                    handleConditionChange(groupId, condition.id, 'operation', e.target.value)
                                }
                                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 px-4 py-2 pr-8 appearance-none min-w-0 text-sm"
                            >
                                {operations.map((operation) => (
                                    <option key={operation.value} value={operation.value} className="bg-gray-800 text-white">
                                        {operation.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {needsValue && (
                            <div className="relative min-w-0 flex-1 group">
                                {fieldType === 'number' && (
                                    <input
                                        type="number"
                                        value={condition.value.toString()}
                                        onChange={(e) =>
                                            handleConditionChange(
                                                groupId,
                                                condition.id,
                                                'value',
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        placeholder="Enter amount"
                                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 px-4 py-2 text-sm"
                                    />
                                )}

                                {fieldType === 'date' && (
                                    <input
                                        type="date"
                                        value={
                                            typeof condition.value === 'string'
                                                ? condition.value.slice(0, 10)
                                                : new Date().toISOString().slice(0, 10)
                                        }
                                        onChange={(e) =>
                                            handleConditionChange(groupId, condition.id, 'value', e.target.value)
                                        }
                                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 px-4 py-2 text-sm"
                                    />
                                )}

                                {(fieldType === 'string' || fieldType === 'array') && (
                                    <input
                                        type="text"
                                        value={condition.value.toString()}
                                        onChange={(e) =>
                                            handleConditionChange(groupId, condition.id, 'value', e.target.value)
                                        }
                                        placeholder={fieldType === 'array' ? 'Enter tags (comma separated)' : 'Enter value'}
                                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-200 px-4 py-2 text-sm"
                                    />
                                )}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"></div>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => handleRemove(groupId, condition.id)}
                    className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {renderGroup(value)}

            {onPreview && (
                <div className="flex justify-center pt-4">
                    <button
                        type="button"
                        onClick={onPreview}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview Audience
                    </button>
                </div>
            )}
        </div>
    );
}
