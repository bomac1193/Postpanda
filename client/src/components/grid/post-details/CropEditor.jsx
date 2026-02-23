import React from 'react';
import { Cropper } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';

const CropEditor = React.memo(function CropEditor({
  cropperKey,
  cropperRef,
  src,
  onChange,
  defaultCoordinates,
  aspectRatio,
}) {
  return (
    <div className="p-4 pb-2">
      <div
        className="relative bg-dark-700 rounded-lg overflow-hidden"
        style={{ height: '400px' }}
      >
        {src ? (
          <Cropper
            key={cropperKey}
            ref={cropperRef}
            src={src}
            onChange={onChange}
            defaultCoordinates={defaultCoordinates}
            stencilProps={{
              aspectRatio,
              movable: true,
              resizable: true,
              grid: true,
            }}
            style={{ height: '100%', width: '100%' }}
            imageRestriction="fitArea"
            transitions={false}
          />
        ) : (
          <div className="text-dark-500 flex items-center justify-center h-full">No image to edit</div>
        )}
      </div>
    </div>
  );
});

export default CropEditor;
