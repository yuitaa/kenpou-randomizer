interface ConstitutionArticle {
  num: string;
  content: {
    text: string;
    items?: string[];
  }[];
}

interface AppData {
  processedConstitution: ConstitutionArticle[];
  extractedWords: string[];
  siteUrl: string;
}

function init() {
  const dataElement = document.getElementById('app-data');
  if (!dataElement || !dataElement.textContent) return;

  const { processedConstitution, extractedWords, siteUrl } = JSON.parse(dataElement.textContent) as AppData;

  const contentArea = document.getElementById('constitution-content');
  const randomizeBtn = document.getElementById('randomize-btn');
  const copyBtn = document.getElementById('copy-btn');
  const speakBtn = document.getElementById('speak-btn');

  if (!contentArea || !randomizeBtn || !copyBtn || !speakBtn) return;

  // Web Speech API Support check
  const synth = window.speechSynthesis;
  const isSpeechSupported = !!synth;

  if (isSpeechSupported) {
    speakBtn.classList.remove('hidden');
  }

  // 漢数字変換用のフォーマッタ
  const kanjiFormatter = new Intl.NumberFormat('ja-JP-u-nu-hanidec');

  let currentTextData = {
    num: '',
    paragraphs: [] as { text: string; items: string[] }[],
  };

  function getRandomItem<T>(arr: T[]): T | '' {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 単語置換処理（HTML版とテキスト版を同時に生成）
  function processText(text: string) {
    let html = text;
    let raw = text;

    // @を一つずつ処理して、同じ単語を両方に適用する
    while (html.includes('@')) {
      const word = getRandomItem(extractedWords);
      if (word === '') break;

      html = html.replace(
        '@',
        `<span class="text-amber-700 font-bold underline decoration-amber-400 underline-offset-4">${word}</span>`,
      );
      raw = raw.replace('@', word);
    }

    return { html, raw };
  }

  function randomize() {
    // 読み上げ中なら停止
    if (isSpeechSupported) {
      synth.cancel();
      speakBtn!.innerText = '読み上げる';
    }

    const article = getRandomItem(processedConstitution);
    if (article === '') return;

    currentTextData = {
      num: article.num,
      paragraphs: [],
    };

    let html = `<h2 class="text-xl md:text-2xl font-bold text-amber-900 border-b-2 border-amber-200 pb-2">${article.num}</h2>`;

    article.content.forEach((paragraph) => {
      const processed = processText(paragraph.text);

      const pData = {
        text: processed.raw,
        items: [] as string[],
      };

      html += `<div class="flex flex-col gap-2">
        <p class="text-lg md:text-xl leading-relaxed text-gray-900">
          ${processed.html}
        </p>`;

      if (paragraph.items && paragraph.items.length > 0) {
        html += `<ol class="space-y-1 ml-10 list-[cjk-ideographic] marker:text-amber-800 marker:font-bold">`;
        paragraph.items.forEach((item) => {
          const processedItem = processText(item);

          pData.items.push(processedItem.raw);

          html += `<li class="text-lg md:text-xl text-gray-800 pl-2">
            <span class="leading-relaxed">${processedItem.html}</span>
          </li>`;
        });
        html += `</ol>`;
      }

      html += `</div>`;
      currentTextData.paragraphs.push(pData);
    });

    contentArea!.style.opacity = '0';
    contentArea!.innerHTML = html;

    requestAnimationFrame(() => {
      contentArea!.style.transition = 'opacity 0.2s ease-out';
      contentArea!.style.opacity = '1';
    });
  }

  async function copyToClipboard() {
    if (!currentTextData.num) return;

    let text = `${currentTextData.num}\n`;

    currentTextData.paragraphs.forEach((p) => {
      text += `${p.text}\n`;
      p.items.forEach((item, idx) => {
        const kanjiNum = kanjiFormatter.format(idx + 1);
        text += `${kanjiNum}、 ${item}\n`;
      });
    });

    text += `\n日本国憲法ランダマイザー <${siteUrl}>`;

    try {
      await navigator.clipboard.writeText(text);

      const originalText = copyBtn!.innerText;
      copyBtn!.innerText = 'コピー完了';
      copyBtn!.classList.add('bg-amber-100');

      setTimeout(() => {
        copyBtn!.innerText = originalText;
        copyBtn!.classList.remove('bg-amber-100');
      }, 1500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  function toggleSpeak() {
    if (!isSpeechSupported || !currentTextData.num) return;

    if (synth.speaking) {
      synth.cancel();
      speakBtn!.innerText = '読み上げる';
      return;
    }

    let text = `${currentTextData.num}\n`;
    currentTextData.paragraphs.forEach((p) => {
      text += `${p.text}\n`;
      p.items.forEach((item, idx) => {
        const kanjiNum = kanjiFormatter.format(idx + 1);
        text += `${kanjiNum}. ${item}\n`;
      });
    });

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.0;

    utterance.onstart = () => {
      speakBtn!.innerText = '停止する';
    };

    utterance.onend = () => {
      speakBtn!.innerText = '読み上げる';
    };

    utterance.onerror = () => {
      speakBtn!.innerText = '読み上げる';
    };

    synth.speak(utterance);
  }

  randomizeBtn.addEventListener('click', randomize);
  copyBtn.addEventListener('click', copyToClipboard);
  if (isSpeechSupported) {
    speakBtn.addEventListener('click', toggleSpeak);
  }

  // 初回表示
  randomize();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
