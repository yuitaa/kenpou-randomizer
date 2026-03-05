import { XMLParser } from 'fast-xml-parser';
import xmlData from './constitution.xml?raw';

interface Paragraph {
  text: string;
  items?: string[];
}

interface StructuredArticle {
  num: string; // e.g. "第一条"
  content: Paragraph[];
}

const ensureArray = <T>(obj: T | T[] | undefined): T[] => {
  if (obj === undefined) return [];
  return Array.isArray(obj) ? obj : [obj];
};

const extractText = (parent: any): string => {
  const sentenceNodes = ensureArray(parent?.Sentence);
  return sentenceNodes.map((s) => (typeof s === 'string' ? s : s['#text'] || '')).join('');
};

const extractParagraphs = (parent: any): Paragraph[] => {
  const paragraphNodes = ensureArray(parent?.Paragraph);
  return paragraphNodes.map((p) => {
    const items = ensureArray(p.Item).map((i) => extractText(i.ItemSentence));

    return {
      text: extractText(p.ParagraphSentence),
      items: items.length > 0 ? items : undefined,
    };
  });
};

const parseConstitution = (xml: string): StructuredArticle[] => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });

  const jsonObj = parser.parse(xml);
  const lawBody = jsonObj.Law.LawBody;
  const chapters = ensureArray(lawBody.MainProvision.Chapter);

  const result: StructuredArticle[] = [];

  // Main Provisions
  for (const chapter of chapters) {
    const articles = ensureArray(chapter.Article);

    for (const article of articles) {
      const content = extractParagraphs(article);

      result.push({
        num: article.ArticleTitle,
        content,
      });
    }
  }

  return result;
};

export const constitution = parseConstitution(xmlData);
