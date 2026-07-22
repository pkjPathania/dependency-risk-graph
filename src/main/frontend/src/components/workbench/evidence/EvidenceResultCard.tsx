import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Fragment, type ReactNode } from 'react';
import type { AdvisoryEvidenceMatch, AdvisoryEvidenceSegmentType } from '../../../api/workbenchEvidence';
import { designTokens } from '../../../theme/designTokens';
import { EvidenceResultHeader } from './EvidenceResultHeader';
import { identifierPattern } from './evidenceSearchUtils';

interface EvidenceResultCardProps {
  match: AdvisoryEvidenceMatch;
  rank: number;
  queryIdentifier: string | null;
  exactIdentifierMatch: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onCopySuccess: () => void;
  onCopyError: (message: string) => void;
}

const PREVIEW_CHARACTER_LIMIT = 800;
const PREVIEW_LINE_LIMIT = 10;

export function EvidenceResultCard({
  match,
  rank,
  queryIdentifier,
  exactIdentifierMatch,
  expanded,
  onToggleExpanded,
  onCopySuccess,
  onCopyError
}: EvidenceResultCardProps) {
  const isLong = isLongEvidence(match.text);
  const displayedText = expanded || !isLong ? match.text : evidencePreview(match.text);
  const tone = segmentTone(match.segmentType);

  async function handleCopy() {
    if (!navigator.clipboard) {
      onCopyError('Copy is not available in this browser.');
      return;
    }

    try {
      await navigator.clipboard.writeText(match.text);
      onCopySuccess();
    } catch (error) {
      onCopyError(error instanceof Error ? error.message : 'Unable to copy evidence.');
    }
  }

  return (
    <Card variant="outlined" component="article">
      <CardContent sx={{ p: { xs: 1.75, sm: 2 }, '&:last-child': { pb: { xs: 1.75, sm: 2 } } }}>
        <Stack spacing={1.5}>
          <EvidenceResultHeader
            match={match}
            rank={rank}
            exactIdentifierMatch={exactIdentifierMatch}
            segmentTone={tone}
            vulnerabilityId={highlightIdentifier(match.vulnerabilityId, queryIdentifier)}
          />

          <Tooltip title={match.id} enterDelay={400}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: designTokens.text.muted,
                fontFamily: 'monospace',
                overflowWrap: 'anywhere'
              }}
            >
              {match.id}
            </Typography>
          </Tooltip>

          <Divider />

          <Typography
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.65 }}
          >
            {highlightIdentifier(displayedText, queryIdentifier)}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyOutlinedIcon />}
              onClick={handleCopy}
              aria-label={`Copy evidence ${match.id}`}
            >
              Copy evidence
            </Button>
            {isLong ? (
              <Button
                size="small"
                variant="text"
                startIcon={expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                onClick={onToggleExpanded}
                aria-expanded={expanded}
                aria-label={`${expanded ? 'Collapse' : 'Show full evidence'} ${match.id}`}
              >
                {expanded ? 'Collapse' : 'Show full evidence'}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function isLongEvidence(text: string): boolean {
  return text.length > PREVIEW_CHARACTER_LIMIT || text.split('\n').length > PREVIEW_LINE_LIMIT;
}

function evidencePreview(text: string): string {
  const lineLimited = text.split('\n').slice(0, PREVIEW_LINE_LIMIT).join('\n');
  const characterLimited = lineLimited.slice(0, PREVIEW_CHARACTER_LIMIT).trimEnd();
  return `${characterLimited}…`;
}

function highlightIdentifier(text: string, identifier: string | null): ReactNode {
  if (!identifier) {
    return text;
  }

  const matches = [...text.matchAll(identifierPattern(identifier))];
  if (matches.length === 0) {
    return text;
  }

  const parts: ReactNode[] = [];
  let position = 0;

  matches.forEach((match, index) => {
    const matchIndex = match.index ?? 0;
    parts.push(text.slice(position, matchIndex));
    parts.push(
      <Box
        component="mark"
        key={`${matchIndex}-${index}`}
        sx={{
          bgcolor: alpha(designTokens.accent.lime, 0.35),
          color: 'inherit',
          borderRadius: 0.5,
          px: 0.125
        }}
      >
        {match[0]}
      </Box>
    );
    position = matchIndex + match[0].length;
  });
  parts.push(text.slice(position));

  return <Fragment>{parts}</Fragment>;
}

function segmentTone(segmentType: AdvisoryEvidenceSegmentType) {
  switch (segmentType) {
    case 'REMEDIATION':
      return designTokens.evidence.remediation;
    case 'TECHNICAL_DETAILS':
      return designTokens.evidence.technicalDetails;
    case 'IMPACT':
      return designTokens.evidence.impact;
    case 'SEVERITY':
      return designTokens.evidence.severity;
    case 'OVERVIEW':
      return designTokens.evidence.overview;
    case 'UPSTREAM_FIX':
      return designTokens.evidence.upstreamFix;
    default:
      return designTokens.evidence.unknown;
  }
}
