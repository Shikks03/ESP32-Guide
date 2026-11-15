import type { BlockFamily, LabStatus } from '../../content/types';
import { BoardSvg } from '../../components/BoardSvg';
import { STATE_WORD, type BlockState } from '../../lib/coverage';
import { FAMILIES, familyKey } from './families';

export interface LayerBlock {
  id: string;
  name: string;
  family: BlockFamily;
  state: LabStatus | 'none';
}

export interface LayerProps {
  layer: 0 | 1 | 2;
  blocks: LayerBlock[];
  selected?: string;
  onSelect?: (id: string) => void;
}

/**
 * Flat, no-WebGL view of the layers: the board drawing for the Board and Module layers,
 * and a floor plan of the die (tiles grouped by family) for the Chip layer.
 */
export default function FloorPlan({ layer, blocks, selected, onSelect }: LayerProps) {
  if (layer < 2) {
    return (
      <div className="ds-flat ds-flat-board">
        <BoardSvg
          pins={[]}
          legend="pinout"
          highlightHotspot={layer === 1 ? 'module' : undefined}
          title={layer === 1 ? 'ESP32 DevKit, the WROOM-32 module highlighted' : 'ESP32 DevKit board'}
        />
      </div>
    );
  }
  return (
    <div className="ds-flat" role="group" aria-label="Floor plan of the die">
      {FAMILIES.map((fam) => {
        const list = blocks.filter((b) => b.family === fam);
        return (
          <div className="ds-flat-fam" key={fam} data-fam={familyKey(fam)}>
            <h4 className="ds-flat-name">{fam}</h4>
            <div className="ds-flat-tiles">
              {list.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="ds-tile"
                  data-state={b.state}
                  aria-pressed={selected === b.id}
                  onClick={() => onSelect?.(b.id)}
                >
                  <span>{b.name}</span>
                  <small>{STATE_WORD[b.state as BlockState]}</small>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
