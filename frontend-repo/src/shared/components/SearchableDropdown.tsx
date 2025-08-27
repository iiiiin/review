'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function SearchableDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
  required = false,
  className = '',
  disabled = false
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 검색어에 따라 옵션 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionSelect = (option: string) => {
    if (disabled) return;
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // 입력값이 옵션 중 하나와 정확히 일치하면 선택
    if (options.includes(newValue)) {
      onChange(newValue);
    } else {
      // 일치하지 않으면 빈 값으로 설정 (사용자가 직접 입력 중)
      onChange('');
    }
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const handleToggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const displayValue = value || searchTerm;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${
              disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
            }`}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {value && !disabled && (
              <button
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleToggleDropdown}
              disabled={disabled}
              className={`p-1 text-gray-400 hover:text-gray-600 ${
                disabled ? 'cursor-not-allowed' : ''
              }`}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                      value === option ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
