import React from 'react';
import { Artifact } from '../types';

interface ArtifactCardProps {
  artifact: Artifact;
  onClick: () => void;
  disabled: boolean;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex flex-col items-center p-4 border-2 rounded-lg transition-all duration-300
        ${disabled 
          ? 'opacity-50 cursor-not-allowed border-parchment-800 bg-parchment-300' 
          : 'border-parchment-800 bg-parchment-200 hover:bg-white hover:scale-105 hover:shadow-xl cursor-pointer'
        }
      `}
    >
      <div className="text-5xl mb-3 drop-shadow-md group-hover:animate-bounce">
        {artifact.icon}
      </div>
      <h3 className="text-xl font-bold font-serif text-parchment-900 mb-1">{artifact.name}</h3>
      <p className="text-sm text-parchment-800 text-center font-serif leading-tight">
        {artifact.description}
      </p>
      
      {!disabled && (
        <div className="absolute inset-0 border-2 border-gold opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300 pointer-events-none" />
      )}
    </button>
  );
};