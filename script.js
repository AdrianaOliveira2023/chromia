const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const palette = document.getElementById('palette');
const clearButton = document.getElementById('clearPalette');
const colorCount = document.getElementById('colorCount');

let selectedColors = [];
let maxColors = 15;

canvas.width = 600;
canvas.height = 600;

/* =========================
   INIT
========================= */

window.addEventListener('DOMContentLoaded', () => {
  maxColors = Number(colorCount.value);
});

/* =========================
   INPUT NORMAL
========================= */

imageInput.addEventListener('change', (event) => {
  const file = event.target.files[0];

  if (!file) return;

  loadImage(file);
});

/* =========================
   DRAG AND DROP
========================= */

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();

  dropZone.classList.remove('dragover');

  const file = event.dataTransfer.files[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Arquivo inválido');
    return;
  }

  loadImage(file);
});

/* =========================
   QUANTIDADE DE CORES
========================= */

colorCount.addEventListener('change', () => {
  maxColors = Number(colorCount.value);

  requestAnimationFrame(() => {
    generatePalette();
  });
});

/* =========================
   CARREGAR IMAGEM
========================= */

function loadImage(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const img = new Image();

    img.src = e.target.result;

    img.onload = () => {
      const size = 600;

      canvas.width = size;
      canvas.height = size;

      const scale = Math.max(
        size / img.width,
        size / img.height
      );

      const width = img.width * scale;
      const height = img.height * scale;

      const x = (size - width) / 2;
      const y = (size - height) / 2;

      ctx.clearRect(0, 0, size, size);

      ctx.drawImage(
        img,
        x,
        y,
        width,
        height
      );

      generatePalette();
    };
  };

  reader.readAsDataURL(file);
}

/* =========================
   GERAR PALETA
========================= */

function generatePalette() {
  selectedColors = [];

  const { data: pixels } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const colorMap = {};
  const step = 6;
  const len = pixels.length;

  for (let i = 0; i < len; i += 4 * step) {
    const alpha = pixels[i + 3];

    // ignora transparência
    if (alpha < 120) continue;

    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    /* =========================
       QUANTIZAÇÃO SEGURA
    ========================= */

    const roundedR = Math.min(
      255,
      Math.floor(r / 16) * 16
    );

    const roundedG = Math.min(
      255,
      Math.floor(g / 16) * 16
    );

    const roundedB = Math.min(
      255,
      Math.floor(b / 16) * 16
    );

    const hex = rgbToHex(
      roundedR,
      roundedG,
      roundedB
    );

    colorMap[hex] =
      (colorMap[hex] || 0) + 1;
  }

  /* =========================
     ORGANIZAÇÃO DA PALETA
  ========================= */

  selectedColors = Object.entries(colorMap)
    .sort((a, b) => b[1] - a[1]) // frequência
    .map(([hex]) => hex)
    .slice(0, maxColors)
    .sort(
      (a, b) =>
        getBrightness(b) -
        getBrightness(a)
    );

  renderPalette();
}

/* =========================
   LIMPAR
========================= */

clearButton.addEventListener('click', () => {
  selectedColors = [];

  renderPalette();
});

/* =========================
   RENDERIZAR
========================= */

function renderPalette() {
  palette.innerHTML = '';

  palette.style.maxHeight = '800px';
  palette.style.overflowY = 'auto';

  selectedColors.forEach(
    (color, index) => {
      const card =
        document.createElement('div');

      card.className = 'color-card';

      card.innerHTML = `
        <div 
          class="color-preview" 
          style="background:${color}">
        </div>

        <div class="color-info">
          <span>${color}</span>

          <div class="actions">
            <button 
              class="copy-btn" 
              data-color="${color}">
              ⧉
            </button>

            <button 
              class="remove-btn" 
              data-index="${index}">
              ✕
            </button>
          </div>
        </div>
      `;

      palette.appendChild(card);
    }
  );
}

/* =========================
   EVENTOS PALETA
========================= */

palette.addEventListener(
  'click',
  (event) => {
    const copyBtn =
      event.target.closest('.copy-btn');

    if (copyBtn) {
      const color =
        copyBtn.dataset.color;

      navigator.clipboard.writeText(
        color
      );

      showToast(`${color} copiada`);
    }

    const removeBtn =
      event.target.closest(
        '.remove-btn'
      );

    if (removeBtn) {
      const index =
        removeBtn.dataset.index;

      selectedColors.splice(index, 1);

      renderPalette();
    }
  }
);

/* =========================
   RGB -> HEX
========================= */

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((v) => {
        // segurança extra
        const safe = Math.max(
          0,
          Math.min(255, v)
        );

        return safe
          .toString(16)
          .padStart(2, '0');
      })
      .join('')
      .toUpperCase()
  );
}

/* =========================
   LUMINOSIDADE
========================= */

function getBrightness(hex) {
  const r = parseInt(
    hex.substring(1, 3),
    16
  );

  const g = parseInt(
    hex.substring(3, 5),
    16
  );

  const b = parseInt(
    hex.substring(5, 7),
    16
  );

  return (
    (r * 299 +
      g * 587 +
      b * 114) /
    1000
  );
}

/* =========================
   TOAST
========================= */

function showToast(message) {
  const toast =
    document.createElement('div');

  toast.className = 'toast';
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 1800);
}
