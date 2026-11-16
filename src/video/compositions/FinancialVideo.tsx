import React from 'react';
import { AbsoluteFill, Audio, Sequence } from 'remotion';
import { StoryScene } from '../components/StoryScene';
import type { VideoProps } from '../types';

export const FinancialVideo: React.FC<VideoProps> = ({ scenes, musicUrl }) => {
  let offset = 0;
  return (
    <AbsoluteFill>
      {scenes.map((scene, index) => {
        const from = offset;
        offset += scene.durationFrames;
        return (
          <Sequence key={`${index}-${scene.title}`} from={from} durationInFrames={scene.durationFrames}>
            <StoryScene scene={scene} sceneIndex={index} totalScenes={scenes.length} />
          </Sequence>
        );
      })}
      {musicUrl && <Audio src={musicUrl} volume={0.10} />}
    </AbsoluteFill>
  );
};
