'use client';

import { ImpactData } from '@/types';

interface ImpactPanelProps {
  impacts: ImpactData[];
}

export default function ImpactPanel({ impacts }: ImpactPanelProps) {
  if (impacts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No impact data available
      </div>
    );
  }

  const totalDeaths = impacts.reduce((sum, imp) => sum + imp.muertes_estimadas, 0);
  const totalInjuries = impacts.reduce((sum, imp) => sum + imp.heridos_estimados, 0);
  const totalLosses = impacts.reduce((sum, imp) => sum + imp.perdidas_monetarias_usd, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Overall Impact Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Est. Deaths</div>
            <div className="text-2xl font-bold text-red-600">{totalDeaths.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Est. Injuries</div>
            <div className="text-2xl font-bold text-orange-600">{totalInjuries.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Est. Losses</div>
            <div className="text-2xl font-bold text-yellow-600">
              ${(totalLosses / 1e9).toFixed(2)}B
            </div>
          </div>
        </div>
      </div>

      {/* Country-specific impacts */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Affected Countries</h3>
        {impacts.map((impact, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-lg text-gray-900">{impact.pais}</h4>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getDestructionLevelClass(
                  impact.nivel_destruccion
                )}`}
              >
                {impact.nivel_destruccion}
              </span>
            </div>

            {impact.ciudades_afectadas && impact.ciudades_afectadas.length > 0 && (
              <div className="mb-3">
                <span className="text-sm text-gray-600">Affected cities: </span>
                <span className="text-sm font-medium text-gray-900">
                  {impact.ciudades_afectadas.join(', ')}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-gray-600">Deaths</div>
                <div className="text-lg font-semibold text-red-600">
                  {impact.muertes_estimadas.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Injuries</div>
                <div className="text-lg font-semibold text-orange-600">
                  {impact.heridos_estimados.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Economic Losses</div>
                <div className="text-lg font-semibold text-yellow-600">
                  ${(impact.perdidas_monetarias_usd / 1e6).toFixed(1)}M
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Infrastructure</div>
                <div className="text-sm font-medium text-gray-700">
                  {impact.nivel_preparacion_sismica || 'Unknown'}
                </div>
              </div>
            </div>

            {/* Building Code Information */}
            {impact.codigo_construccion && (
              <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="text-xs font-medium text-blue-800 mb-1">Building Code:</div>
                <div className="text-sm text-blue-900">{impact.codigo_construccion}</div>
              </div>
            )}

            {/* AI Reasoning */}
            {impact.razonamiento_ia && (
              <div className="mb-3 p-3 bg-purple-50 rounded border border-purple-200">
                <div className="text-xs font-medium text-purple-800 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
                  </svg>
                  AI Assessment Reasoning:
                </div>
                <div className="text-sm text-purple-900 leading-relaxed whitespace-pre-line">
                  {impact.razonamiento_ia}
                </div>
              </div>
            )}

            {/* Factors Considered by AI */}
            {impact.factores_considerados && impact.factores_considerados.length > 0 && (
              <div className="mb-3 p-2 bg-indigo-50 rounded border border-indigo-200">
                <div className="text-xs font-medium text-indigo-800 mb-1">Factors Considered:</div>
                <ul className="list-disc list-inside text-sm text-indigo-900 space-y-1">
                  {impact.factores_considerados.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Original Assessment Factors (fuentes_inferidas) */}
            {impact.fuentes_inferidas && impact.fuentes_inferidas.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-600 mb-1">Data Sources:</div>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {impact.fuentes_inferidas.map((fuente, idx) => (
                    <li key={idx}>{fuente}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getDestructionLevelClass(level: string): string {
  const normalizedLevel = level.toUpperCase();
  switch (normalizedLevel) {
    case 'CATASTROFICO':
    case 'CATASTROPHIC':
      return 'bg-red-100 text-red-800';
    case 'ALTO':
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    case 'MODERADO':
    case 'MODERATE':
      return 'bg-yellow-100 text-yellow-800';
    case 'BAJO':
    case 'LOW':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
