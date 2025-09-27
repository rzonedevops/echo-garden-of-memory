import { MemoryStore } from './store.js';
import { ContinuityManager } from './continuity.js';
import { EchoManager } from './echo.js';
import { MemoryNetwork } from './network.js';
import { HolographicIdentity } from './holographic.js';
import { MEMORY_CONSTANTS } from './types.js';
import logger from '../../../utils/logger.js';

export class MemoryOrchestrator {
  constructor(config) {
    this.config = config;
    this.store = new MemoryStore(config);
    this.continuity = new ContinuityManager(config);
    this.echoes = new EchoManager();
    this.network = new MemoryNetwork(config);
    this.holographicIdentity = new HolographicIdentity(config);
  }

  async storeMemory(key, content, context = {}) {
    try {
      // Store in primary store
      const memory = await this.store.store(key, content, context);

      // Create memory node in network
      this.network.addNode(key, memory);

      // Create echo if significant
      if (memory.accessCount >= MEMORY_CONSTANTS.CONSOLIDATION_THRESHOLD) {
        const echo = this.echoes.createEcho(memory);
        await this.store.associate(key, [`echo:${echo.key}`]);
      }

      // Add to current context if exists
      if (this.continuity.currentContext) {
        await this.continuity.recordMemory(key, memory);
      }

      return memory;
    } catch (error) {
      logger.error('Failed to store memory:', error);
      throw error;
    }
  }

  async recallMemory(key, context = {}) {
    try {
      // Recall from store
      const memory = await this.store.recall(key);
      if (!memory) return null;

      // Strengthen network connections
      this.network.strengthenConnections(key);

      // Find related memories
      const related = await this.findRelatedMemories(key);

      // Find and merge echoes
      const echoes = this.echoes.findEchoes(memory);
      if (echoes.length > 0) {
        const merged = this.echoes.mergeEchoes(echoes);
        memory.echoes = merged;
      }

      return {
        memory,
        related,
        echoes: echoes.length
      };
    } catch (error) {
      logger.error('Failed to recall memory:', error);
      throw error;
    }
  }

  async findRelatedMemories(key, options = {}) {
    const memory = await this.store.recall(key);
    if (!memory) return [];

    // Get directly related memories from network
    const networkRelated = this.network.findRelated(
      key,
      options.relationship,
      options.limit
    );

    // Find similar memories by associations
    const similar = await this.store.findSimilar(
      key,
      options.limit
    );

    // Find contextual memories if in context
    let contextual = [];
    if (this.continuity.currentContext) {
      contextual = await this.continuity.findContextualMemories(
        this.continuity.currentContext.id,
        options.limit
      );
    }

    // Merge and deduplicate results
    const allRelated = new Map();
    
    [...networkRelated, ...similar, ...contextual].forEach(related => {
      if (!allRelated.has(related.key)) {
        allRelated.set(related.key, related);
      }
    });

    return Array.from(allRelated.values())
      .sort((a, b) => b.strength - a.strength)
      .slice(0, options.limit || 10);
  }

  async linkMemories(sourceKey, targetKey, relationship) {
    try {
      // Create network connection
      this.network.addEdge(sourceKey, targetKey, relationship);

      // Create bidirectional association
      await this.store.associate(sourceKey, [`rel:${relationship}:${targetKey}`]);
      await this.store.associate(targetKey, [`rel:${relationship}:${sourceKey}`]);

      // Link in continuity if in same context
      if (this.continuity.currentContext) {
        await this.continuity.linkMemories(sourceKey, targetKey, relationship);
      }

      return true;
    } catch (error) {
      logger.error('Failed to link memories:', error);
      throw error;
    }
  }

  async maintain() {
    try {
      // Prune old memories
      await this.store.prune();

      // Prune weak network connections
      this.network.pruneWeakConnections();

      // Prune old echoes
      this.echoes.pruneEchoes();

      // Detect and analyze memory clusters
      const clusters = this.network.detectClusters();
      
      logger.info('Memory maintenance completed', {
        clusters: clusters.size
      });
    } catch (error) {
      logger.error('Memory maintenance failed:', error);
      throw error;
    }
  }

  async beginContext(context) {
    await this.continuity.beginContext(context);
  }

  async synthesizeContext() {
    return this.continuity.synthesizeContext();
  }

  // Holographic Identity Methods

  /**
   * Process memory through holographic identity system
   */
  async processHolographicMemory(key, content, context = {}) {
    try {
      // Store memory normally first
      const memory = await this.storeMemory(key, content, context);
      
      // Ingest into holographic identity
      const experiencePattern = this.holographicIdentity.ingestExperience(memory, context);
      
      // Preserve continuity
      const continuityResult = this.holographicIdentity.preserveContinuity(memory);
      
      logger.info('Memory processed through holographic identity', {
        memoryKey: key,
        patternId: experiencePattern.id,
        continuityPreserved: continuityResult.continuityPreserved
      });
      
      return {
        memory,
        experiencePattern,
        continuityResult
      };
    } catch (error) {
      logger.error('Failed to process holographic memory:', error);
      throw error;
    }
  }

  /**
   * Reconstruct holographic representation from distributed echoes
   */
  async reconstructHologram(memoryKeys = []) {
    try {
      // Get echoes for specified memories or all recent echoes
      let echoes = [];
      if (memoryKeys.length > 0) {
        for (const key of memoryKeys) {
          const memory = await this.store.recall(key);
          if (memory) {
            const memoryEchoes = this.echoes.findEchoes(memory);
            echoes.push(...memoryEchoes);
          }
        }
      } else {
        // Get all echoes
        echoes = Array.from(this.echoes.echoes.values());
      }
      
      // Reconstruct hologram
      const hologram = this.holographicIdentity.reconstructHologram(echoes);
      
      logger.info('Hologram reconstructed', {
        echoCount: echoes.length,
        patternCount: hologram.patterns.size,
        coherence: hologram.coherence
      });
      
      return hologram;
    } catch (error) {
      logger.error('Failed to reconstruct hologram:', error);
      throw error;
    }
  }

  /**
   * Generate gestalt-level intuitive response
   */
  async gestaltIntuition(query, context = {}) {
    try {
      const intuition = this.holographicIdentity.gestaltIntuition(query, context);
      
      logger.info('Gestalt intuition generated', {
        confidence: intuition.confidence,
        insightCount: intuition.insights.length,
        resonance: intuition.resonance
      });
      
      return intuition;
    } catch (error) {
      logger.error('Failed to generate gestalt intuition:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in recent experiences
   */
  async detectIdentityAnomalies(limit = 100) {
    try {
      // Get recent memories
      const recentMemories = await this.getRecentMemories(limit);
      
      // Detect anomalies
      const anomalies = this.holographicIdentity.detectAnomalies(recentMemories);
      
      if (anomalies.length > 0) {
        logger.warn('Identity anomalies detected', {
          anomalyCount: anomalies.length,
          severities: anomalies.map(a => a.severity)
        });
      }
      
      return anomalies;
    } catch (error) {
      logger.error('Failed to detect identity anomalies:', error);
      throw error;
    }
  }

  /**
   * Get current identity snapshot
   */
  getIdentitySnapshot() {
    return this.holographicIdentity.getIdentitySnapshot();
  }

  /**
   * Export holographic identity data
   */
  exportHolographicIdentity() {
    return this.holographicIdentity.exportHolographicData();
  }

  /**
   * Import holographic identity data
   */
  importHolographicIdentity(data) {
    return this.holographicIdentity.importHolographicData(data);
  }

  // Helper methods

  async getRecentMemories(limit = 100) {
    // Simple implementation - get all memories and sort by timestamp
    const allMemories = [];
    
    // This is a simplified approach - in a real implementation,
    // you'd want to optimize this with proper indexing
    for (const [key, memory] of this.store.memories.entries()) {
      allMemories.push({ key, ...memory });
    }
    
    return allMemories
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
}