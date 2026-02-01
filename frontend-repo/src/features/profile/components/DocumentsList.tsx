'use client';

import { useState, useMemo } from 'react';
import Button from '@/shared/components/Button';
import Modal from '@/shared/components/Modal';
import type { Document } from '@/shared/types/document';
import { RiFileTextLine, RiFolderLine, RiFileEditLine } from 'react-icons/ri';

const iconMap = {
  resume: <RiFileTextLine className="text-2xl mr-4 text-gray-500" />,
  portfolio: <RiFolderLine className="text-2xl mr-4 text-gray-500" />,
  script: <RiFileEditLine className="text-2xl mr-4 text-gray-500" />,
};

interface DocumentsListProps {
  documents: Document[];
}

export default function DocumentsList({ documents }: DocumentsListProps) {
  const [typeFilter, setTypeFilter] = useState<'resume' | 'portfolio' | 'script' | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentDocTitle, setCurrentDocTitle] = useState('');

  const handlePreview = (doc: Document) => {
    if (doc.fileUrl) {
      setCurrentDocTitle(`[${doc.fileType}] ${doc.company} - ${doc.job}`);
      setPreviewUrl(doc.fileUrl);
      setIsModalOpen(true);
    } else {
      alert('미리보기할 수 없는 파일입니다.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewUrl(null);
    setCurrentDocTitle('');
  };

  const processedDocuments = useMemo(() => {
    let processed = [...documents];

    if (typeFilter) {
      processed = processed.filter(doc => doc.fileType === typeFilter);
    }

    if (searchTerm) {
      processed = processed.filter(doc =>
        (doc.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doc.job?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doc.fileName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'oldest':
        processed.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
        break;
      case 'company':
        processed.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
        break;
      case 'latest':
      default:
        processed.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        break;
    }

    return processed;
  }, [documents, typeFilter, searchTerm, sortBy]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">서류 관리</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="회사, 직무 또는 파일 이름으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="latest">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="company">회사명순</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['resume', 'portfolio', 'script'] as const).map(type => (
          <div key={type} onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${typeFilter === type ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <p className="font-semibold capitalize">{type === 'resume' ? '지원서' : type === 'portfolio' ? '포트폴리오' : '답변 스크립트'}</p>
            <p className="text-2xl font-bold">{documents.filter(d => d.fileType === type).length}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {processedDocuments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {processedDocuments.map(doc => (
              <li key={doc.fileUuid} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  {iconMap[doc.fileType]}
                  <div>
                    <p className="font-semibold">
                      [{doc.fileType === 'resume' ? '지원서' : doc.fileType === 'portfolio' ? '포트폴리오' : '답변 스크립트'}] {doc.company} - {doc.job}
                    </p>
                    <p className="text-sm text-gray-500">
                      업로드: {new Date(doc.uploadedAt).toLocaleDateString()}
                      {doc.fileName && <span className="ml-2 font-normal">({doc.fileName})</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    className="text-sm py-1 px-2"
                    onClick={() => handlePreview(doc)}
                  >
                    미리보기
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentDocTitle} size="4xl">
        <div className="w-full h-[80vh]">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-none"
              title="File Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">미리보기할 파일이 없습니다.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
