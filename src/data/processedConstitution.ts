import { constitution } from '@/data/constitution';

const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
const kanjiRegex = /^\p{Script=Han}+$/u;

const words: string[] = [];

const extractWord = (text: string): string => {
  const segments = segmenter.segment(text);
  let processed: string = '';

  for (const segment of segments) {
    if (kanjiRegex.test(segment.segment) && segment.segment.length > 1) {
      words.push(segment.segment);
      processed += '@';
    } else {
      processed += segment.segment;
    }
  }

  return processed;
};

export const processedConstitution = constitution.map(({ num, content }) => {
  const processedContent = content.map(({ text, items }) => {
    const processedText = extractWord(text);
    const processedItems = items?.map((item) => extractWord(item));
    return { text: processedText, items: processedItems };
  });
  return { num, content: processedContent };
});

export const extractedWords = structuredClone(words);
