// src/pages/InterviewSetup/components/DocumentSection.tsx
'use client';

import { useState, type ChangeEvent, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useInterviewSetupStore } from '../InterviewSetupStore';
import * as DocumentsAPI from '@/shared/api/documents';
import type { Document as UserFile } from '@/shared/types/document';
import FileInput from './FileInput';

export default function DocumentSection({
  docType,
  title,
  description,
}: {
  docType: 'resume' | 'portfolio' | 'script';
  title: string;
  description: string;
}) {
  const [activeTab, setActiveTab] = useState('upload');
  const { data: documents, isLoading } = useQuery({
    queryKey: ['userDocuments'],
    queryFn: DocumentsAPI.getUserDocumentsAPI,
    staleTime: 5 * 60 * 1000, // 5분
  });

  const documentState = useInterviewSetupStore((state) => state[docType]);
  const setDocumentState = useInterviewSetupStore((state) => {
    if (docType === 'resume') return state.setResume;
    if (docType === 'portfolio') return state.setPortfolio;
    return state.setScript;
  });

  const filteredDocuments = useMemo(
    () => documents?.filter((doc) => doc.fileType === docType) || [],
    [documents, docType]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentState({ file: e.target.files[0], uuid: null });
    }
  };

  const handleRemoveFile = () => {
    setDocumentState({ file: null, uuid: null });
  };

  const handleSelectExisting = (doc: UserFile) => {
    setDocumentState({ file: null, uuid: doc.fileUuid });
  };

  const renderSelectedFileInfo = () => {
    if (documentState.uuid) {
      const selectedDoc = documents?.find(d => d.fileUuid === documentState.uuid);
      return (
        <div className="mt-2 text-sm text-blue-600">
          선택된 파일: {selectedDoc?.company} / {selectedDoc?.job}.pdf (기존 파일)
        </div>
      );
    }
    if (documentState.file) {
      return (
        <div className="mt-2 text-sm text-green-600">
          선택된 파일: {documentState.file.name} (새 파일)
        </div>
      );
    }
    return null;
  };

  const acceptString = docType === 'script' ? '.pdf,.txt,.doc,.docx' : '.pdf,.docx';

  return (
    <div>
      <h3 className="font-semibold text-gray-700">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('upload')}
          className={`py-2 px-4 ${activeTab === 'upload' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          새 파일 업로드
        </button>
        <button
          onClick={() => setActiveTab('select')}
          className={`py-2 px-4 ${activeTab === 'select' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          기존 파일 선택
        </button>
      </div>

      {activeTab === 'upload' && (
        <FileInput
          label=""
          file={documentState.file}
          onFileChange={handleFileChange}
          onFileRemove={handleRemoveFile}
          accept={acceptString}
        />
      )}

      {activeTab === 'select' && (
        <div className="max-h-48 overflow-y-auto rounded-md border">
          {isLoading && <p className="p-4 text-gray-500">목록을 불러오는 중...</p>}
          {!isLoading && filteredDocuments.length === 0 && (
            <p className="p-4 text-gray-500">업로드된 {title} 파일이 없습니다.</p>
          )}
          <ul className="divide-y">
            {filteredDocuments.map((doc) => (
              <li
                key={doc.fileUuid}
                onClick={() => handleSelectExisting(doc)}
                className={`p-3 cursor-pointer hover:bg-gray-100 ${documentState.uuid === doc.fileUuid ? 'bg-blue-100' : ''}`}
              >
                <p className="font-medium">{doc.company} - {doc.job}</p>
                <p className="text-sm text-gray-500">
                  업로드: {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {renderSelectedFileInfo()}
    </div>
  );
}
