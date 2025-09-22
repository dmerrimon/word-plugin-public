/**
 * Protocol Template Selector Component
 * Allows users to select and customize protocol templates
 */

import * as React from 'react';
import { 
  Button, 
  Card, 
  Text, 
  Title, 
  Badge, 
  Dropdown, 
  Option,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogBody,
  Field,
  Input,
  Textarea
} from '@fluentui/react-components';
import { 
  DocumentTemplate20Regular, 
  Eye20Regular, 
  Add20Regular,
  Edit20Regular,
  Copy20Regular 
} from '@fluentui/react-icons';
import { ProtocolTemplateService, ProtocolTemplate } from '../services/protocolTemplateService';

interface ProtocolTemplateSelectorProps {
  onTemplateSelected: (protocolText: string) => void;
  onInsertText: (text: string) => void;
}

export const ProtocolTemplateSelector: React.FC<ProtocolTemplateSelectorProps> = ({
  onTemplateSelected,
  onInsertText
}) => {
  const [selectedPhase, setSelectedPhase] = React.useState<string>('all');
  const [selectedTherapeuticArea, setSelectedTherapeuticArea] = React.useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = React.useState<ProtocolTemplate | null>(null);
  const [customizations, setCustomizations] = React.useState<any>({});

  const allTemplates = ProtocolTemplateService.getAllTemplates();
  
  const filteredTemplates = allTemplates.filter(template => {
    const phaseMatch = selectedPhase === 'all' || template.phase.toLowerCase().includes(selectedPhase.toLowerCase());
    const areaMatch = selectedTherapeuticArea === 'all' || 
                     template.therapeuticArea.toLowerCase().includes(selectedTherapeuticArea.toLowerCase()) ||
                     template.therapeuticArea === 'General';
    return phaseMatch && areaMatch;
  });

  const phases = ['all', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Observational'];
  const therapeuticAreas = ['all', 'Oncology', 'Cardiology', 'Neurology', 'Infectious Disease', 'Endocrinology', 'General'];

  const handleUseTemplate = (template: ProtocolTemplate) => {
    const protocolText = ProtocolTemplateService.generateProtocolFromTemplate(template, customizations);
    onTemplateSelected(protocolText);
  };

  const handlePreviewTemplate = (template: ProtocolTemplate) => {
    setPreviewTemplate(template);
    setCustomizations({});
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Title size="medium" style={{ marginBottom: '8px' }}>
          Protocol Templates from 14,000+ Real Studies
        </Title>
        <Text size="small" style={{ color: '#666' }}>
          Start with proven templates based on successful CT.gov protocols
        </Text>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Field label="Phase">
          <Dropdown
            value={selectedPhase}
            selectedOptions={[selectedPhase]}
            onOptionSelect={(_, data) => setSelectedPhase(data.optionValue || 'all')}
            style={{ minWidth: '120px' }}
          >
            {phases.map(phase => (
              <Option key={phase} value={phase}>
                {phase === 'all' ? 'All Phases' : phase}
              </Option>
            ))}
          </Dropdown>
        </Field>

        <Field label="Therapeutic Area">
          <Dropdown
            value={selectedTherapeuticArea}
            selectedOptions={[selectedTherapeuticArea]}
            onOptionSelect={(_, data) => setSelectedTherapeuticArea(data.optionValue || 'all')}
            style={{ minWidth: '140px' }}
          >
            {therapeuticAreas.map(area => (
              <Option key={area} value={area}>
                {area === 'all' ? 'All Areas' : area}
              </Option>
            ))}
          </Dropdown>
        </Field>
      </div>

      {/* Template Cards */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredTemplates.map(template => (
          <Card key={template.id} style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <Title size="small" style={{ marginBottom: '4px' }}>
                  {template.name}
                </Title>
                <Text size="small" style={{ color: '#666', marginBottom: '8px' }}>
                  {template.description}
                </Text>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <Badge appearance="outline" color="brand" size="small">
                    {template.phase}
                  </Badge>
                  <Badge appearance="outline" color="important" size="small">
                    {template.therapeuticArea}
                  </Badge>
                </div>
                <Text size="tiny" style={{ color: '#999' }}>
                  {template.realWorldBasis}
                </Text>
              </div>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  appearance="subtle"
                  icon={<Eye20Regular />}
                  size="small"
                  onClick={() => handlePreviewTemplate(template)}
                >
                  Preview
                </Button>
                <Button
                  appearance="primary"
                  icon={<DocumentTemplate20Regular />}
                  size="small"
                  onClick={() => handleUseTemplate(template)}
                >
                  Use Template
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Insert Sections */}
      <div style={{ marginTop: '24px' }}>
        <Title size="small" style={{ marginBottom: '12px' }}>
          Quick Insert Common Sections
        </Title>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Standard Inclusion Criteria', type: 'inclusion' },
            { label: 'Standard Exclusion Criteria', type: 'exclusion' },
            { label: 'Primary Endpoints', type: 'primary_endpoint' },
            { label: 'Secondary Endpoints', type: 'secondary_endpoint' }
          ].map(section => (
            <Button
              key={section.type}
              appearance="outline"
              icon={<Add20Regular />}
              size="small"
              onClick={() => {
                const examples = ProtocolTemplateService.getExampleText(section.type);
                if (examples.length > 0) {
                  onInsertText(examples.join('\n'));
                }
              }}
            >
              {section.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Template Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={(_, data) => !data.open && setPreviewTemplate(null)}>
          <DialogSurface style={{ maxWidth: '800px', maxHeight: '90vh' }}>
            <DialogBody>
              <DialogTitle>{previewTemplate.name}</DialogTitle>
              <DialogContent>
                <div style={{ marginBottom: '16px' }}>
                  <Text style={{ color: '#666' }}>
                    {previewTemplate.description}
                  </Text>
                  <div style={{ margin: '8px 0' }}>
                    <Badge appearance="outline" color="brand" size="small" style={{ marginRight: '6px' }}>
                      {previewTemplate.phase}
                    </Badge>
                    <Badge appearance="outline" color="important" size="small">
                      {previewTemplate.therapeuticArea}
                    </Badge>
                  </div>
                </div>

                {/* Customization Fields */}
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                  <Title size="small" style={{ marginBottom: '8px' }}>Customize Template</Title>
                  <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <Field label="Drug/Intervention Name">
                      <Input
                        value={customizations.drugName || ''}
                        onChange={(e) => setCustomizations({...customizations, drugName: e.target.value})}
                        placeholder="e.g., Study Drug X"
                        size="small"
                      />
                    </Field>
                    <Field label="Condition">
                      <Input
                        value={customizations.condition || ''}
                        onChange={(e) => setCustomizations({...customizations, condition: e.target.value})}
                        placeholder="e.g., Advanced Solid Tumors"
                        size="small"
                      />
                    </Field>
                  </div>
                </div>

                {/* Template Preview */}
                <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', padding: '12px', borderRadius: '4px' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.4' }}>
                    {ProtocolTemplateService.generateProtocolFromTemplate(previewTemplate, customizations)}
                  </pre>
                </div>

                <div style={{ marginTop: '12px', fontSize: '11px', color: '#999' }}>
                  Based on: {previewTemplate.realWorldBasis}
                </div>
              </DialogContent>
            </DialogBody>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              <Button 
                appearance="primary" 
                icon={<Copy20Regular />}
                onClick={() => {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
              >
                Use This Template
              </Button>
            </DialogActions>
          </DialogSurface>
        </Dialog>
      )}
    </div>
  );
};