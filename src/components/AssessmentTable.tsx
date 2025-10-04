/**
 * Assessment Zone Table Component
 * Displays assessment zone entries with filtering and search capabilities
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AssessmentEntry, AssessmentFilters } from '../types/assessment';

interface AssessmentTableProps {
  entries: AssessmentEntry[];
  onRefresh: () => void;
  isLoading?: boolean;
  lastUpdated?: string;
  timezone: 'UTC+8' | 'Local';
}

const AssessmentTable: React.FC<AssessmentTableProps> = ({
  entries,
  onRefresh,
  isLoading = false,
  lastUpdated,
  timezone
}) => {
  const [filters, setFilters] = useState<AssessmentFilters>({
    status: 'All',
    searchToken: '',
    startDateFrom: '',
    startDateTo: '',
    endsSoon: false,
    timezone: 'Local'
  });
  const [sortField, setSortField] = useState<keyof AssessmentEntry>('startDateIsoUtc');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let filtered = entries.filter(entry => {
      // Status filter
      if (filters.status !== 'All' && entry.status !== filters.status) {
        return false;
      }

      // Search filter
      if (filters.searchToken && !entry.token.toLowerCase().includes(filters.searchToken.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (filters.startDateFrom && entry.startDateIsoUtc < filters.startDateFrom) {
        return false;
      }
      if (filters.startDateTo && entry.startDateIsoUtc > filters.startDateTo) {
        return false;
      }

      // Ends soon filter
      if (filters.endsSoon && (!entry.daysRemaining || entry.daysRemaining > 7)) {
        return false;
      }

      return true;
    });

    // Sort entries
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle different data types
      if (sortField === 'startDateIsoUtc' || sortField === 'endDateIsoUtc') {
        aValue = aValue || '';
        bValue = bValue || '';
      } else if (sortField === 'daysInAssessment') {
        aValue = a.daysInAssessment || 0;
        bValue = b.daysInAssessment || 0;
      } else if (sortField === 'daysRemaining') {
        aValue = a.daysRemaining || 0;
        bValue = b.daysRemaining || 0;
      }

      // Ensure aValue and bValue are defined for comparison
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Special sorting for "ends soon"
    if (filters.endsSoon) {
      filtered.sort((a, b) => {
        const aRemaining = a.daysRemaining || 999;
        const bRemaining = b.daysRemaining || 999;
        return aRemaining - bRemaining;
      });
    }

    return filtered;
  }, [entries, filters, sortField, sortDirection]);

  const handleSort = (field: keyof AssessmentEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string, isLocal: boolean = false) => {
    const date = new Date(dateString);
    if (timezone === 'Local' || isLocal) {
      return date.toLocaleDateString('ru-RU', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('ru-RU', {
        timeZone: 'Asia/Shanghai', // UTC+8
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'Active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const openAnnouncement = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Assessment Zone Monitor
          </h2>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {new Date(lastUpdated).toLocaleTimeString('ru-RU')}
              </span>
            )}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Token
            </label>
            <input
              type="text"
              value={filters.searchToken}
              onChange={(e) => setFilters(prev => ({ ...prev, searchToken: e.target.value }))}
              placeholder="Enter token name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Start Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date From
            </label>
            <input
              type="date"
              value={filters.startDateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, startDateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Start Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date To
            </label>
            <input
              type="date"
              value={filters.startDateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, startDateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Ends Soon */}
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.endsSoon}
                onChange={(e) => setFilters(prev => ({ ...prev, endsSoon: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Ends Soon</span>
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('token')}
              >
                <div className="flex items-center space-x-1">
                  <span>Token</span>
                  {sortField === 'token' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('startDateIsoUtc')}
              >
                <div className="flex items-center space-x-1">
                  <span>Start Date</span>
                  {sortField === 'startDateIsoUtc' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('endDateIsoUtc')}
              >
                <div className="flex items-center space-x-1">
                  <span>End Date</span>
                  {sortField === 'endDateIsoUtc' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('daysInAssessment')}
              >
                <div className="flex items-center space-x-1">
                  <span>Days in Assessment</span>
                  {sortField === 'daysInAssessment' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {entries.length === 0 ? 'No assessment entries found' : 'No entries match the current filters'}
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry, index) => (
                <tr
                  key={`${entry.token}-${entry.startDateIsoUtc}-${index}`}
                  className={`hover:bg-gray-50 ${entry.isNew ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.token}
                      </span>
                      {entry.isNew && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.startDateIsoUtc, true)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.endDateIsoUtc ? formatDate(entry.endDateIsoUtc, true) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.daysInAssessment !== undefined ? `${entry.daysInAssessment} days` : '-'}
                    {entry.daysRemaining !== undefined && entry.daysRemaining > 0 && (
                      <div className="text-xs text-gray-500">
                        ({entry.daysRemaining} days left)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(entry.status)}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openAnnouncement(entry.announcementUrl)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => {/* TODO: Show token history modal */}}
                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>History</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {filteredEntries.length} of {entries.length} entries
          </span>
          <span>
            {filters.status !== 'All' && `Filtered by: ${filters.status}`}
            {filters.searchToken && `, search: "${filters.searchToken}"`}
            {filters.endsSoon && ', ends soon'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssessmentTable;
