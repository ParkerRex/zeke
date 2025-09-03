import { sampleClusters } from '@/features/stories/fixtures/sample-clusters';
import { Cluster } from '@/features/stories/types';

export function listStories(): Cluster[] {
  return sampleClusters;
}

export function getStoryById(id: string): Cluster | undefined {
  return sampleClusters.find((c) => c.id === id);
}

export function getShareSnapshot(id: string): Cluster | undefined {
  // For prototype, reuse the same dataset
  return getStoryById(id) ?? sampleClusters[0];
}
