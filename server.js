import express from "express";
import fetch from "node-fetch";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = process.env.PORT || 3000;

// ====================
// CONFIGURAÇÃO DO SITE
// ====================
const TARGET_SITE = "http://br2.bronxyshost.com:4009/gruposwpp";
const BASE_PATH = ""; // Vazio porque seu site está na raiz
const SITE_NAME = "Fabi Bot";

console.log(`🌐 Configurando proxy para: ${TARGET_SITE}`);

// ====================
// MIDDLEWARE DE LOG
// ====================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

// ====================
// ROTAS ESTÁTICAS
// ====================
// Arquivos estáticos locais (se você tiver)
app.use('/local', express.static('public'));

// ====================
// PROXY INTELIGENTE
// ====================
app.use('*', async (req, res) => {
  try {
    // 1. Construir URL de destino
    let targetUrl;
    
    // Remover /gruposwpp da URL se existir (para compatibilidade)
    let cleanUrl = req.originalUrl;
    if (cleanUrl.startsWith('/gruposwpp')) {
      cleanUrl = cleanUrl.replace('/gruposwpp', '');
    }
    
    targetUrl = `${TARGET_SITE}${cleanUrl}`;
    
    console.log(`🔗 Proxy: ${cleanUrl} -> ${targetUrl}`);
    
    // 2. Fazer a requisição
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': req.headers.accept || '*/*',
        'Accept-Language': req.headers['accept-language'] || 'pt-BR,pt;q=0.9,en;q=0.8',
        'Referer': TARGET_SITE,
        'Origin': TARGET_SITE
      },
      redirect: 'manual' // Lidar com redirecionamentos manualmente
    });

    // 3. Lidar com redirecionamentos
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (location) {
        // Se for redirecionamento interno, mantém no proxy
        if (location.startsWith('/')) {
          return res.redirect(location);
        }
        // Se for redirecionamento externo, redireciona diretamente
        return res.redirect(response.status, location);
      }
    }

    // 4. Se não conseguir acessar o site
    if (!response.ok) {
      console.warn(`⚠️ Site retornou ${response.status} para ${targetUrl}`);
      return handleError(res, response.status);
    }

    // 5. Obter tipo de conteúdo
    const contentType = response.headers.get('content-type') || '';
    res.set('Content-Type', contentType);

    // ====================
    // PROCESSAR HTML
    // ====================
    if (contentType.includes('text/html')) {
      let html = await response.text();
      
      // 5.1 CORRIGIR TITLE e META
      html = html.replace(
        /<title>.*?<\/title>/i,
        `<title>${SITE_NAME} - Proxy</title>`
      );
      
      // 5.2 CORRIGIR LINKS ABSOLUTOS
      html = html.replace(
        /(href|src|action)=["'](\/[^"'?#][^"']*)["']/g,
        (match, attr, path) => {
          // Ignorar links que já são absolutos ou protocolos
          if (path.startsWith('//') || 
              path.startsWith('http://') || 
              path.startsWith('https://') ||
              path.startsWith('mailto:') ||
              path.startsWith('tel:') ||
              path.startsWith('data:') ||
              path.startsWith('javascript:')) {
            return match;
          }
          
          // Ignorar âncoras
          if (path.startsWith('#')) {
            return match;
          }
          
          // Adicionar base path
          return `${attr}="${BASE_PATH}${path}"`;
        }
      );
      
      // 5.3 CORRIGIR URLs EM CSS
      html = html.replace(
        /url\(['"]?(\/[^"'?#][^"']*)['"]?\)/g,
        (match, path) => {
          if (path.startsWith('//') || path.startsWith('http')) {
            return match;
          }
          return `url('${BASE_PATH}${path}')`;
        }
      );
      
      // 5.4 ADICIONAR BASE TAG SE NÃO EXISTIR
      if (!html.includes('<base href')) {
        html = html.replace(
          /<head>/i,
          `<head>\n<base href="${BASE_PATH}/">`
        );
      }
      
      // 5.5 CORRIGIR FORMS
      html = html.replace(
        /<form([^>]*)action="(\/[^"]*)"([^>]*)>/g,
        (match, before, action, after) => {
          return `<form${before}action="${BASE_PATH}${action}"${after}>`;
        }
      );
      
      // 5.6 INJETAR SCRIPT DE DETECÇÃO (opcional)
      html = html.replace(
        /<\/head>/i,
        `<script>
          // Detectar se está dentro do proxy
          window.IS_PROXY = true;
          window.ORIGINAL_SITE = "${TARGET_SITE}";
          
          // Função para corrigir links dinamicamente
          document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href^="/"]');
            if (link && !link.href.includes('${TARGET_SITE}')) {
              e.preventDefault();
              const newHref = '${BASE_PATH}' + link.getAttribute('href');
              window.location.href = newHref;
            }
          });
          
          console.log('🚀 Proxy ativo: ${SITE_NAME}');
        </script>
        </head>`
      );
      
      return res.send(html);
    }
    
    // ====================
    // PROCESSAR CSS
    // ====================
    if (contentType.includes('text/css')) {
      let css = await response.text();
      
      // Corrigir URLs dentro do CSS
      css = css.replace(
        /url\(['"]?(\/[^"'?#][^"']*)['"]?\)/g,
        (match, path) => {
          return `url('${BASE_PATH}${path}')`;
        }
      );
      
      return res.send(css);
    }
    
    // ====================
    // PROCESSAR JAVASCRIPT
    // ====================
    if (contentType.includes('application/javascript') || 
        contentType.includes('text/javascript')) {
      let js = await response.text();
      
      // Corrigir fetch/AJAX requests
      js = js.replace(
        /fetch\(['"]\/([^'"]*)['"]/g,
        `fetch('${BASE_PATH}/$1'`
      );
      
      // Corrigir outras requisições
      js = js.replace(
        /["']\/(api|assets|images|css|js|fonts)\//g,
        `"${BASE_PATH}/$1/`
      );
      
      return res.send(js);
    }
    
    // ====================
    // OUTROS ARQUIVOS
    // ====================
    // Para imagens, fonts, etc - passar diretamente
    const buffer = await response.buffer();
    return res.send(buffer);
    
  } catch (error) {
    console.error('❌ ERRO NO PROXY:', error.message);
    return handleError(res, 500, error.message);
  }
});

// ====================
// FUNÇÕES AUXILIARES
// ====================
function handleError(res, status, message = '') {
  switch(status) {
    case 404:
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${SITE_NAME} - Página não encontrada</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #ff4757; }
            a { color: #3742fa; text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>🔍 Página não encontrada</h1>
          <p>A página que você procura não existe no proxy.</p>
          <p><a href="${BASE_PATH}/">Voltar para a página inicial</a></p>
          <p style="margin-top: 50px; color: #666; font-size: 12px;">
            Proxy: ${SITE_NAME} | Original: ${TARGET_SITE}
          </p>
        </body>
        </html>
      `);
      
    case 500:
    default:
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${SITE_NAME} - Erro no Proxy</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #ff4757; }
            code { background: #f1f2f6; padding: 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>⚡ Erro no Proxy</h1>
          <p>Não foi possível carregar a página através do proxy.</p>
          <p><code>${message}</code></p>
          <p>Tente novamente em alguns instantes.</p>
          <p style="margin-top: 50px; color: #666; font-size: 12px;">
            Proxy: ${SITE_NAME} | Original: ${TARGET_SITE}
          </p>
        </body>
        </html>
      `);
  }
}

// ====================
// ROTA DE SAÚDE
// ====================
app.get('/proxy-health', async (req, res) => {
  try {
    const test = await fetch(TARGET_SITE, { timeout: 5000 });
    res.json({
      status: 'healthy',
      proxy: 'active',
      target: TARGET_SITE,
      target_status: test.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      target: TARGET_SITE
    });
  }
});

// ====================
// ROTA DE INFORMAÇÕES
// ====================
app.get('/proxy-info', (req, res) => {
  res.json({
    name: SITE_NAME,
    target: TARGET_SITE,
    base_path: BASE_PATH,
    version: '1.0.0',
    features: ['html_rewrite', 'css_rewrite', 'js_rewrite', 'auto_base_tag']
  });
});

// ====================
// INICIAR SERVIDOR
// ====================
app.listen(PORT, () => {
  console.log(`
  🚀 PROXY INICIADO COM SUCESSO!
  ================================
  📍 Local:    http://localhost:${PORT}
  🎯 Target:   ${TARGET_SITE}
  🏷️  Nome:    ${SITE_NAME}
  📂 Base:     ${BASE_PATH || '/'}
  ⏰ Início:   ${new Date().toLocaleString()}
  
  🔗 Health:   http://localhost:${PORT}/proxy-health
  📊 Info:     http://localhost:${PORT}/proxy-info
  
  💡 Dica: Acesse http://localhost:${PORT} para ver seu site através do proxy!
  `);
});

// ====================
// HANDLE SHUTDOWN
// ====================
process.on('SIGINT', () => {
  console.log('\n\n🛑 Proxy encerrado pelo usuário');
  process.exit(0);
});
