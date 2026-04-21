import os, logging, asyncio, re, time, aiohttp, io, subprocess, json
from telethon import TelegramClient, events, Button
from telethon.sessions import StringSession
from telethon.tl.types import Channel, Chat, User
from datetime import datetime
from collections import defaultdict

logging.basicConfig(format="%(asctime)s [%(levelname)s] %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Variáveis de ambiente ─────────────────────────────────────────────────────

API_ID    = int(os.environ["API_ID"])
API_HASH  = os.environ["API_HASH"]
SESSION   = os.environ["SESSION_STRING"]
BOT_TOKEN = os.environ["BOT_TOKEN"]
BOT_NOME  = os.environ.get("BOT_NOME", "UserBot")
ADMIN_IDS = set(int(x) for x in os.environ.get("ADMIN_IDS", "").split(",") if x.strip().isdigit())
DOCKER_IMAGE = os.environ.get("DOCKER_IMAGE", "inforlozzi/userbot-v3")

_tgt_raw = os.environ.get("TARGET_GROUP_ID", "")
DESTINOS = set(int(x) for x in re.split(r"[,; ]+", _tgt_raw) if x.strip().lstrip("-").isdigit())
SRC_RAW  = os.environ.get("SOURCE_CHAT_IDS", "")
SRC      = set(int(x) for x in re.split(r"[,; ]+", SRC_RAW) if x.strip().lstrip("-").isdigit())

MOD             = os.environ.get("FORWARD_MODE", "forward")
stats           = {"n": 0, "err": 0, "start": datetime.now(), "por_hora": defaultdict(int)}
PAUSADO         = False
FILTROS_ON      = set()
FILTROS_OFF     = set()
IGNORADOS       = set()
HISTORICO       = []
AGUARDANDO      = {}
PREFIXO         = ""
RODAPE          = ""
DELAY           = 0
SOMENTE_TIPOS   = set()
SEM_BOTS        = False
AGENDAMENTO     = {"ativo": False, "inicio": "00:00", "fim": "23:59"}
ultimo_envio    = 0
MODO_SILENCIOSO = False

# ── Reseller Bots ─────────────────────────────────────────────────────────────

RESELLER_BOTS = {}   # { "nome": { "token": ..., "container": ..., "ativo": True, "criado": "...", "admin_ids": [...] } }
RESELLER_LIMITE = {
    "max_destinos": 5,
    "max_origens":  10,
    "ia_permitida": True,
    "expira_em":    None,
}

# ── IA: Configuração ──────────────────────────────────────────────────────────

IA_CONFIG = {
    "ativo":        False,
    "provedor":     "openai",
    "modelo_oai":   "gpt-4o-mini",
    "modelo_gem":   "gemini-2.0-flash",
    "api_key_oai":  os.environ.get("OPENAI_API_KEY", ""),
    "api_key_gem":  os.environ.get("GEMINI_API_KEY", ""),
    "prompt":       (
        "Você é um assistente que processa mensagens do Telegram. "
        "Reescreva a mensagem a seguir de forma clara e objetiva, "
        "mantendo o significado original. Responda APENAS com o texto "
        "reescrito, sem explicações adicionais."
    ),
    "modo":         "reescrever",
    # Nomes dos slots custom
    "personalizado_2_nome": "Custom 2",
    "personalizado_3_nome": "Custom 3",
    # Imagem
    "img_ativo":    False,
    "img_logo":     b"",
    "img_logo_nome":"",
    "img_posicao":  "inferior_direito",
    "img_escala":   25,
    "img_opacidade":90,
    # Efeitos de imagem
    "img_filtro":            "nenhum",   # nenhum | bw | vintage | bright | contrast
    "img_texto_ativo":       False,
    "img_texto":             "",
    "img_texto_cor":         "#FFFFFF",
    "img_texto_tamanho":     24,
    "img_texto_pos":         "inferior_esquerdo",
    "img_borda_ativo":       False,
    "img_borda_cor":         "#000000",
    "img_borda_espessura":   5,
}

PROMPTS_PADRAO = {
    "reescrever":    "Reescreva a mensagem a seguir de forma clara e objetiva, mantendo o significado original. Responda APENAS com o texto reescrito.",
    "resumir":       "Resuma a mensagem a seguir em 1-2 frases objetivas. Responda APENAS com o resumo.",
    "traduzir":      "Traduza a mensagem a seguir para o português do Brasil. Responda APENAS com a tradução.",
    "personalizado": "",
    "adicionar_hashtags": "Leia a mensagem a seguir e adicione de 3 a 6 hashtags relevantes no final do texto. Retorne o texto original com as hashtags no final, sem explicações.",
    "personalizado_2": "",
    "personalizado_3": "",
}

# ── Emojis ────────────────────────────────────────────────────────────────────

E_ORIGEM  = "\U0001F4E1"
E_DESTINO = "\U0001F3AF"
E_MODO    = "\U0001F504"
E_FILTRO  = "\U0001F50D"
E_HORARIO = "\u23F0"
E_MSG     = "\U0001F4AC"
E_STATUS  = "\U0001F4CA"
E_HIST    = "\U0001F4DC"
E_INFO    = "\u2139\uFE0F"
E_ID      = "\U0001F50E"
E_PAUSAR  = "\u23F8\uFE0F"
E_RETOMAR = "\u25B6\uFE0F"
E_SIL     = "\U0001F514"
E_SILOFF  = "\U0001F515"
E_FECHAR  = "\u274C"
E_MAIS    = "\u2795"
E_MENOS   = "\u2796"
E_VER     = "\U0001F4CB"
E_LIMPAR  = "\U0001F9F9"
E_VOLTAR  = "\u2B05\uFE0F"
E_USER    = "\U0001F464"
E_VIP     = "\u2B50"
E_BOT2    = "\U0001F916"
E_GROUP   = "\U0001F465"
E_CHANNEL = "\U0001F4E2"
E_FORUM   = "\U0001F4AC"
E_OK      = "\u2705"
E_MANUAL  = "\u270F\uFE0F"
E_PROX    = "\u27A1\uFE0F"
E_HOME    = "\U0001F3E0"
E_IA      = "\U0001F9E0"
E_KEY     = "\U0001F511"
E_SPARK   = "\u2728"
E_GEAR    = "\u2699\uFE0F"
E_IMG     = "\U0001F5BC\uFE0F"
E_LOGO    = "\U0001F3F7\uFE0F"
E_POS     = "\U0001F4CD"
E_CAM     = "\U0001F4F7"

# ── Cache dialogs ─────────────────────────────────────────────────────────────

_dialogs_cache = {}
_dialogs_ts    = 0
DIALOGS_TTL    = 120
POR_PAG        = 8

userbot = TelegramClient(StringSession(SESSION), API_ID, API_HASH)
bot     = TelegramClient(StringSession(""), API_ID, API_HASH)


def is_admin(uid):
    return not ADMIN_IDS or uid in ADMIN_IDS


async def get_dialogs():
    global _dialogs_cache, _dialogs_ts
    agora = asyncio.get_event_loop().time()
    if _dialogs_cache and (agora - _dialogs_ts) < DIALOGS_TTL:
        return _dialogs_cache
    dialogs = {}
    try:
        async for d in userbot.iter_dialogs(limit=500):
            e = d.entity
            if e is None or not hasattr(e, "id"):
                continue
            try:
                if isinstance(e, Channel):
                    if getattr(e, "forum", False):       cat = "myforum"
                    elif getattr(e, "megagroup", False): cat = "mygroup"
                    elif getattr(e, "broadcast", False): cat = "mychannel"
                    else:                                cat = "mygroup"
                elif isinstance(e, Chat):
                    cat = "mygroup"
                elif isinstance(e, User):
                    if getattr(e, "bot", False):      cat = "bot"
                    elif getattr(e, "premium", False): cat = "premium"
                    else:                             cat = "user"
                else:
                    continue
                nome = getattr(e, "title", None) or getattr(e, "first_name", None) or str(d.id)
                dialogs.setdefault(cat, []).append({
                    "id":       d.id,
                    "name":     str(nome)[:40],
                    "username": getattr(e, "username", None),
                })
            except Exception as ex_inner:
                logger.warning("Pulando dialog %s: %s", d.id, ex_inner)
    except Exception as ex:
        logger.error("Erro ao carregar dialogs: %s", ex)
    _dialogs_cache = dialogs
    _dialogs_ts    = agora
    return dialogs


async def get_dialogs_safe():
    try:
        return await asyncio.wait_for(get_dialogs(), timeout=25)
    except asyncio.TimeoutError:
        logger.error("Timeout ao carregar dialogs")
        return _dialogs_cache if _dialogs_cache else {}


# ════════════════════════════════════════════════════════════════════════════
#  MÓDULO IA — TEXTO
# ════════════════════════════════════════════════════════════════════════════

async def processar_com_ia(texto: str):
    if not texto or not texto.strip():
        return None

    modo = IA_CONFIG["modo"]

    # Modos locais (sem chamada à IA)
    if modo == "cortar_links":
        resultado = re.sub(r"https?://\S+", "", texto).strip()
        return resultado if resultado else texto

    if modo == "remover_mencoes":
        resultado = re.sub(r"@\w+", "", texto).strip()
        return resultado if resultado else texto

    if modo == "uppercase":
        return texto.upper()

    if modo == "lowercase":
        return texto.lower()

    provedor = IA_CONFIG["provedor"]
    prompt   = IA_CONFIG["prompt"] or PROMPTS_PADRAO.get(modo, "")
    try:
        if provedor == "openai":
            api_key = IA_CONFIG["api_key_oai"]
            if not api_key:
                logger.error("[IA] OpenAI key ausente.")
                return None
            payload = {
                "model":    IA_CONFIG["modelo_oai"],
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user",   "content": texto},
                ],
                "max_tokens": 1024,
            }
            headers = {"Authorization": "Bearer " + api_key, "Content-Type": "application/json"}
            async with aiohttp.ClientSession() as s:
                async with s.post("https://api.openai.com/v1/chat/completions",
                                  json=payload, headers=headers,
                                  timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status != 200:
                        logger.error("[IA] OpenAI %s: %s", resp.status, (await resp.text())[:200])
                        return None
                    return (await resp.json())["choices"][0]["message"]["content"].strip()

        elif provedor == "gemini":
            api_key = IA_CONFIG["api_key_gem"]
            if not api_key:
                logger.error("[IA] Gemini key ausente.")
                return None
            url = ("https://generativelanguage.googleapis.com/v1beta/models/"
                   + IA_CONFIG["modelo_gem"] + ":generateContent?key=" + api_key)
            payload = {"contents": [{"parts": [{"text": prompt + "\n\nMensagem:\n" + texto}]}]}
            async with aiohttp.ClientSession() as s:
                async with s.post(url, json=payload,
                                  timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status != 200:
                        logger.error("[IA] Gemini %s: %s", resp.status, (await resp.text())[:200])
                        return None
                    return (await resp.json())["candidates"][0]["content"]["parts"][0]["text"].strip()
    except asyncio.TimeoutError:
        logger.error("[IA] Timeout.")
    except Exception as e:
        logger.error("[IA] Erro: %s", e)
    return None


# ════════════════════════════════════════════════════════════════════════════
#  MÓDULO IA — IMAGEM (Pillow)
# ════════════════════════════════════════════════════════════════════════════

def _pillow_ok():
    try:
        import PIL
        return True
    except ImportError:
        return False


def _hex_to_rgb(hex_color: str):
    """Converte cor hex (#RRGGBB) para tupla (R, G, B)."""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) == 3:
        hex_color = "".join(c*2 for c in hex_color)
    try:
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    except Exception:
        return (255, 255, 255)


def processar_imagem(img_bytes: bytes):
    """Aplica filtros, texto e logo sobre a imagem recebida. Retorna bytes JPEG ou None."""
    try:
        from PIL import Image, ImageEnhance, ImageDraw, ImageFont, ImageOps

        base = Image.open(io.BytesIO(img_bytes)).convert("RGBA")

        # ── Aplicar filtro ────────────────────────────────────────────────
        filtro = IA_CONFIG.get("img_filtro", "nenhum")
        if filtro == "bw":
            grey = base.convert("L")
            base = grey.convert("RGBA")
        elif filtro == "vintage":
            rgb = base.convert("RGB")
            rgb = ImageEnhance.Color(rgb).enhance(0.6)
            rgb = ImageEnhance.Contrast(rgb).enhance(0.85)
            rgb = ImageEnhance.Brightness(rgb).enhance(1.1)
            base = rgb.convert("RGBA")
        elif filtro == "bright":
            rgb = ImageEnhance.Brightness(base.convert("RGB")).enhance(1.2)
            base = rgb.convert("RGBA")
        elif filtro == "contrast":
            rgb = ImageEnhance.Contrast(base.convert("RGB")).enhance(1.3)
            base = rgb.convert("RGBA")

        # ── Sobrepor texto ────────────────────────────────────────────────
        if IA_CONFIG.get("img_texto_ativo") and IA_CONFIG.get("img_texto"):
            draw = ImageDraw.Draw(base)
            tamanho = IA_CONFIG.get("img_texto_tamanho", 24)
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", tamanho)
            except Exception:
                font = ImageFont.load_default()
            cor_rgb = _hex_to_rgb(IA_CONFIG.get("img_texto_cor", "#FFFFFF"))
            txt = IA_CONFIG["img_texto"]
            mg  = int(base.width * 0.02)
            try:
                bbox = draw.textbbox((0, 0), txt, font=font)
                tw = bbox[2] - bbox[0]
                th = bbox[3] - bbox[1]
            except Exception:
                tw, th = draw.textsize(txt, font=font)
            pos_txt = IA_CONFIG.get("img_texto_pos", "inferior_esquerdo")
            pos_map_txt = {
                "superior_esquerdo": (mg, mg),
                "superior_direito":  (base.width - tw - mg, mg),
                "inferior_esquerdo": (mg, base.height - th - mg),
                "inferior_direito":  (base.width - tw - mg, base.height - th - mg),
                "centro":            ((base.width - tw) // 2, (base.height - th) // 2),
            }
            tx, ty = pos_map_txt.get(pos_txt, (mg, base.height - th - mg))
            # Sombra leve
            draw.text((tx+1, ty+1), txt, font=font, fill=(0, 0, 0, 180))
            draw.text((tx, ty), txt, font=font, fill=cor_rgb + (255,))

        # ── Adicionar borda ───────────────────────────────────────────────
        if IA_CONFIG.get("img_borda_ativo"):
            espessura = IA_CONFIG.get("img_borda_espessura", 5)
            cor_borda = _hex_to_rgb(IA_CONFIG.get("img_borda_cor", "#000000"))
            base_rgb = base.convert("RGB")
            base_rgb = ImageOps.expand(base_rgb, border=espessura, fill=cor_borda)
            base = base_rgb.convert("RGBA")

        # ── Aplicar logo ──────────────────────────────────────────────────
        if IA_CONFIG.get("img_logo"):
            logo = Image.open(io.BytesIO(IA_CONFIG["img_logo"])).convert("RGBA")
            escala    = IA_CONFIG["img_escala"] / 100
            nova_larg = max(10, int(base.width * escala))
            ratio     = nova_larg / logo.width
            nova_alt  = max(10, int(logo.height * ratio))
            logo      = logo.resize((nova_larg, nova_alt), Image.LANCZOS)

            opac = int(IA_CONFIG["img_opacidade"] * 2.55)
            if opac < 255:
                r, g, b, a = logo.split()
                a = a.point(lambda x: min(x, opac))
                logo = Image.merge("RGBA", (r, g, b, a))

            mg2 = int(base.width * 0.02)
            pos_map = {
                "superior_esquerdo": (mg2,                          mg2),
                "superior_direito":  (base.width - nova_larg - mg2, mg2),
                "inferior_esquerdo": (mg2,                          base.height - nova_alt - mg2),
                "inferior_direito":  (base.width - nova_larg - mg2, base.height - nova_alt - mg2),
                "centro":            ((base.width - nova_larg) // 2, (base.height - nova_alt) // 2),
            }
            pos = pos_map.get(IA_CONFIG["img_posicao"], pos_map["inferior_direito"])
            overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
            overlay.paste(logo, pos, logo)
            base = Image.alpha_composite(base, overlay)

        resultado = base.convert("RGB")
        buf = io.BytesIO()
        resultado.save(buf, format="JPEG", quality=92)
        return buf.getvalue()
    except Exception as e:
        logger.error("[IA-IMG] %s", e)
        return None


# ════════════════════════════════════════════════════════════════════════════
#  RESELLER ADMIN — Deploy e Gerenciamento de Bots Filhos
# ════════════════════════════════════════════════════════════════════════════

async def deploy_bot_filho(nome: str, config: dict):
    env_vars = {
        "API_ID":         str(API_ID),
        "API_HASH":       API_HASH,
        "BOT_TOKEN":      config["token"],
        "SESSION_STRING": config.get("session", ""),
        "BOT_NOME":       nome,
        "ADMIN_IDS":      ",".join(str(x) for x in config.get("admin_ids", [])),
    }
    env_str = " ".join(f'-e {k}="{v}"' for k, v in env_vars.items())
    cmd = f'docker run -d --name userbot-{nome} --restart unless-stopped {env_str} {DOCKER_IMAGE}'
    proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    out, err = await proc.communicate()
    if proc.returncode == 0:
        return True, out.decode().strip()[:12]
    return False, err.decode().strip()[:200]


async def bot_op(nome: str, op: str) -> str:
    cmds = {
        "start":   f"docker start userbot-{nome}",
        "stop":    f"docker stop userbot-{nome}",
        "restart": f"docker restart userbot-{nome}",
        "logs":    f"docker logs --tail=20 userbot-{nome}",
        "rm":      f"docker stop userbot-{nome} && docker rm userbot-{nome}",
    }
    if op not in cmds:
        return "Operação inválida."
    proc = await asyncio.create_subprocess_shell(
        cmds[op],
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    out, err = await proc.communicate()
    return (out.decode() + err.decode()).strip()[-800:]


# ════════════════════════════════════════════════════════════════════════════
#  MENU FIXO NA BARRA — registrar_menu_comandos + /backup + /restore
# ════════════════════════════════════════════════════════════════════════════

async def registrar_menu_comandos():
    commands = [
        {"command": "menu",    "description": "📋 Painel de controle completo"},
        {"command": "status",  "description": "📊 Ver status e estatísticas"},
        {"command": "ia",      "description": "🧠 Configurar IA (texto + imagem)"},
        {"command": "logo",    "description": "🖼 Enviar logo para sobrepor em fotos"},
        {"command": "admin",   "description": "⚙️ Painel admin de revenda"},
        {"command": "backup",  "description": "💾 Exportar configuração atual"},
        {"command": "restore", "description": "📥 Importar configuração salva"},
        {"command": "start",   "description": "👋 Bem-vindo e instruções"},
    ]
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/setMyCommands"
    payload = {"commands": json.dumps(commands)}
    try:
        async with aiohttp.ClientSession() as s:
            resp = await s.post(url, data=payload)
            data = await resp.json()
            if data.get("ok"):
                logger.info("[MENU] Comandos registrados no menu da barra.")
            else:
                logger.warning("[MENU] Falha ao registrar comandos: %s", data)
    except Exception as e:
        logger.error("[MENU] Erro ao registrar comandos: %s", e)


# ════════════════════════════════════════════════════════════════════════════
#  TEXTOS
# ════════════════════════════════════════════════════════════════════════════

def painel_txt():
    ia_s   = " | IA: " + IA_CONFIG["provedor"].upper() if IA_CONFIG["ativo"]    else " | IA: OFF"
    img_s  = " 🖼ON" if IA_CONFIG["img_ativo"] else ""
    return (
        BOT_NOME + " — Painel\n" + "=" * 24 + "\n"
        "Destinos: " + str(len(DESTINOS)) + "  |  Origens: " + (str(len(SRC)) if SRC else "todos") + "\n"
        "Estado: " + ("PAUSADO" if PAUSADO else "ATIVO") + "  |  Modo: " + MOD + ia_s + img_s
    )


def status_texto():
    up = datetime.now() - stats["start"]
    h, r = divmod(int(up.total_seconds()), 3600); mi, s = divmod(r, 60)
    ia_t  = (IA_CONFIG["provedor"].upper() + "|" + IA_CONFIG["modo"]) if IA_CONFIG["ativo"] else "OFF"
    img_t = ("ON|pos:" + IA_CONFIG["img_posicao"] + "|" + str(IA_CONFIG["img_escala"]) + "%") if IA_CONFIG["img_ativo"] else "OFF"
    sep   = "=" * 22
    return "\n".join([
        BOT_NOME + " — STATUS", sep,
        "Estado   : " + ("PAUSADO" if PAUSADO else "ATIVO"),
        "Silenc.  : " + ("ON" if MODO_SILENCIOSO else "OFF"),
        "Modo     : " + MOD + ("  |sem bots" if SEM_BOTS else ""),
        "Delay    : " + str(DELAY) + "s",
        "IA texto : " + ia_t,
        "IA imagem: " + img_t, sep,
        "Destinos (" + str(len(DESTINOS)) + "): " + str(DESTINOS or "nenhum"),
        "Origens  (" + str(len(SRC))      + "): " + str(SRC or "todos"),
        "Ignorados: " + str(IGNORADOS or "nenhum"), sep,
        "Filtros +: " + str(FILTROS_ON  or "nenhuma"),
        "Filtros -: " + str(FILTROS_OFF or "nenhuma"),
        "Tipos    : " + (", ".join(SOMENTE_TIPOS) or "todos"),
        "Horario  : " + (AGENDAMENTO["inicio"] + " ate " + AGENDAMENTO["fim"] if AGENDAMENTO["ativo"] else "desativado"), sep,
        "Prefixo  : " + (PREFIXO or "nenhum"),
        "Rodape   : " + (RODAPE  or "nenhum"), sep,
        "Enviadas : " + str(stats["n"]) + "  |  Erros: " + str(stats["err"]),
        "Uptime   : " + str(h) + "h " + str(mi) + "m " + str(s) + "s",
    ])


def ia_config_texto():
    k_oai = ("***" + IA_CONFIG["api_key_oai"][-4:]) if IA_CONFIG["api_key_oai"] else "nao definida"
    k_gem = ("***" + IA_CONFIG["api_key_gem"][-4:]) if IA_CONFIG["api_key_gem"] else "nao definida"
    logo  = IA_CONFIG["img_logo_nome"] if IA_CONFIG["img_logo"] else "nenhuma"
    filtro = IA_CONFIG.get("img_filtro", "nenhum")
    return "\n".join([
        E_IA + " CONFIGURACAO DE IA", "=" * 26,
        "IA Texto  : " + ("ATIVA"  if IA_CONFIG["ativo"]     else "INATIVA"),
        "IA Imagem : " + ("ATIVA"  if IA_CONFIG["img_ativo"] else "INATIVA"),
        "Provedor  : " + IA_CONFIG["provedor"].upper(),
        "Modo texto: " + IA_CONFIG["modo"],
        "Modelo OAI: " + IA_CONFIG["modelo_oai"],
        "Modelo GEM: " + IA_CONFIG["modelo_gem"],
        "Key OAI   : " + k_oai,
        "Key GEM   : " + k_gem, "=" * 26,
        "Logo      : " + logo,
        "Posicao   : " + IA_CONFIG["img_posicao"],
        "Escala    : " + str(IA_CONFIG["img_escala"])    + "%",
        "Opacidade : " + str(IA_CONFIG["img_opacidade"]) + "%",
        "Filtro    : " + filtro, "=" * 26,
        "Prompt    :", (IA_CONFIG["prompt"][:180] + "...") if len(IA_CONFIG["prompt"]) > 180 else IA_CONFIG["prompt"],
    ])


def ia_img_texto():
    logo = IA_CONFIG["img_logo_nome"] if IA_CONFIG["img_logo"] else "nenhuma"
    filtro = IA_CONFIG.get("img_filtro", "nenhum")
    txt_status = "ON" if IA_CONFIG.get("img_texto_ativo") else "OFF"
    borda_status = "ON" if IA_CONFIG.get("img_borda_ativo") else "OFF"
    return "\n".join([
        E_IMG + " IA IMAGEM", "=" * 26,
        "Estado   : " + ("ATIVA" if IA_CONFIG["img_ativo"] else "INATIVA"),
        "Logo     : " + logo,
        "Posicao  : " + IA_CONFIG["img_posicao"].replace("_", " "),
        "Escala   : " + str(IA_CONFIG["img_escala"])    + "% da largura",
        "Opacidade: " + str(IA_CONFIG["img_opacidade"]) + "%",
        "Filtro   : " + filtro,
        "Texto img: " + txt_status + (" | " + IA_CONFIG.get("img_texto","")[:30] if IA_CONFIG.get("img_texto_ativo") else ""),
        "Borda    : " + borda_status, "=" * 26,
        "Como usar:",
        "1. Envie sua logo PNG (fundo transparente) via /logo",
        "2. Ajuste posicao, escala e opacidade",
        "3. Ative a IA de Imagem",
        "Toda foto encaminhada recebera sua logo automaticamente.",
    ])


def ia_img_efeitos_texto():
    filtro = IA_CONFIG.get("img_filtro", "nenhum")
    txt_at = "ON" if IA_CONFIG.get("img_texto_ativo") else "OFF"
    borda_at = "ON" if IA_CONFIG.get("img_borda_ativo") else "OFF"
    return "\n".join([
        "🎨 EFEITOS DE IMAGEM", "=" * 26,
        "Filtro      : " + filtro,
        "Texto na img: " + txt_at,
        "Texto       : " + (IA_CONFIG.get("img_texto","") or "nenhum"),
        "Cor texto   : " + IA_CONFIG.get("img_texto_cor","#FFFFFF"),
        "Tamanho     : " + str(IA_CONFIG.get("img_texto_tamanho",24)) + "px",
        "Pos. texto  : " + IA_CONFIG.get("img_texto_pos","inferior_esquerdo").replace("_"," "),
        "Borda       : " + borda_at,
        "Cor borda   : " + IA_CONFIG.get("img_borda_cor","#000000"),
        "Espessura   : " + str(IA_CONFIG.get("img_borda_espessura",5)) + "px",
    ])


def admin_txt():
    total = len(RESELLER_BOTS)
    ativos = sum(1 for b in RESELLER_BOTS.values() if b.get("ativo", False))
    return "\n".join([
        "⚙️ PAINEL ADMIN DE REVENDA", "=" * 28,
        "Bots cadastrados: " + str(total),
        "Bots ativos     : " + str(ativos),
        "Imagem Docker   : " + DOCKER_IMAGE,
    ])


# ════════════════════════════════════════════════════════════════════════════
#  TECLADOS
# ════════════════════════════════════════════════════════════════════════════

def kb_principal():
    est = E_PAUSAR + " Pausar" if not PAUSADO else E_RETOMAR + " Retomar"
    sil = E_SIL + " Silenc." if not MODO_SILENCIOSO else E_SILOFF + " Silenc."
    ia  = E_IA + " IA: ON"  if IA_CONFIG["ativo"]    else E_IA + " IA: OFF"
    return [
        [Button.inline(E_ORIGEM  + " Origens",     b"m_origens"),
         Button.inline(E_DESTINO + " Destinos",    b"m_destinos"),
         Button.inline(E_MODO    + " Modo",         b"m_modo")],
        [Button.inline(E_FILTRO  + " Filtros",     b"m_filtros"),
         Button.inline(E_HORARIO + " Horario",     b"m_agenda"),
         Button.inline(E_MSG     + " Mensagem",    b"m_msg")],
        [Button.inline(E_STATUS  + " Status",      b"m_status"),
         Button.inline(E_HIST    + " Historico",   b"m_hist"),
         Button.inline(E_INFO    + " Info",        b"m_info")],
        [Button.inline(ia,                         b"m_ia"),
         Button.inline(E_ID      + " Descobrir ID",b"disc_menu")],
        [Button.inline(est, b"m_toggle"),
         Button.inline(sil, b"m_silencioso"),
         Button.inline(E_FECHAR + " Fechar", b"m_fechar")],
    ]


def kb_ia():
    at  = (E_OK + " IA TEXTO: ATIVA")  if IA_CONFIG["ativo"]     else "[ ] IA Texto: inativa"
    img = (E_OK + " IA IMG: ATIVA")    if IA_CONFIG["img_ativo"]  else "[ ] IA Img: inativa"
    oai = (E_OK + " OpenAI") if IA_CONFIG["provedor"] == "openai" else "OpenAI"
    gem = (E_OK + " Gemini") if IA_CONFIG["provedor"] == "gemini" else "Gemini"
    modos_basicos = ["reescrever", "resumir", "traduzir", "personalizado"]
    modos_extra   = ["cortar_links", "remover_mencoes", "uppercase", "lowercase",
                     "adicionar_hashtags", "personalizado_2", "personalizado_3"]
    lm = []
    for i in range(0, len(modos_basicos), 2):
        lm.append([Button.inline(
            (E_OK + " " + m) if m == IA_CONFIG["modo"] else m,
            ("ia_modo|" + m).encode()
        ) for m in modos_basicos[i:i+2]])
    # linha de modos extras
    lm.append([Button.inline(
        (E_OK + " " + m) if m == IA_CONFIG["modo"] else m,
        ("ia_modo|" + m).encode()
    ) for m in ["cortar_links", "remover_mencoes"]])
    lm.append([Button.inline(
        (E_OK + " UPPER") if "uppercase" == IA_CONFIG["modo"] else "UPPER",
        b"ia_modo|uppercase"
    ), Button.inline(
        (E_OK + " LOWER") if "lowercase" == IA_CONFIG["modo"] else "LOWER",
        b"ia_modo|lowercase"
    ), Button.inline(
        (E_OK + " #tags") if "adicionar_hashtags" == IA_CONFIG["modo"] else "#tags",
        b"ia_modo|adicionar_hashtags"
    )])
    # slots custom
    n2 = IA_CONFIG.get("personalizado_2_nome", "Custom 2")
    n3 = IA_CONFIG.get("personalizado_3_nome", "Custom 3")
    lm.append([Button.inline(
        (E_OK + " " + n2) if "personalizado_2" == IA_CONFIG["modo"] else n2,
        b"ia_modo|personalizado_2"
    ), Button.inline(
        (E_OK + " " + n3) if "personalizado_3" == IA_CONFIG["modo"] else n3,
        b"ia_modo|personalizado_3"
    )])
    return [
        [Button.inline(at,  b"ia_toggle"), Button.inline(img, b"ia_img_toggle")],
        [Button.inline(E_SPARK + " " + oai, b"ia_prov|openai"),
         Button.inline(E_SPARK + " " + gem, b"ia_prov|gemini")],
        *lm,
        [Button.inline(E_KEY   + " Key OpenAI",    b"ia_key|openai"),
         Button.inline(E_KEY   + " Key Gemini",    b"ia_key|gemini")],
        [Button.inline(E_GEAR  + " Modelo OpenAI", b"ia_model|openai"),
         Button.inline(E_GEAR  + " Modelo Gemini", b"ia_model|gemini")],
        [Button.inline(E_MANUAL + " Prompt custom",   b"ia_prompt"),
         Button.inline(E_MANUAL + " Nome Custom 2",   b"ia_nome_c2"),
         Button.inline(E_MANUAL + " Nome Custom 3",   b"ia_nome_c3")],
        [Button.inline(E_MANUAL + " Prompt C2",       b"ia_prompt_c2"),
         Button.inline(E_MANUAL + " Prompt C3",       b"ia_prompt_c3")],
        [Button.inline(E_INFO   + " Ver config",   b"ia_ver"),
         Button.inline(E_SPARK  + " Testar Texto", b"ia_test")],
        [Button.inline(E_IMG    + " Config Imagem", b"ia_img_menu")],
        [Button.inline(E_VOLTAR + " Voltar", b"m_back")],
    ]


def kb_ia_img():
    at  = (E_OK + " Imagem: ATIVA") if IA_CONFIG["img_ativo"] else "[ ] Imagem: inativa"
    lg  = ("✅ " + IA_CONFIG["img_logo_nome"][:20]) if IA_CONFIG["img_logo"] else "❌ sem logo"
    pos_list = [
        ("superior_esquerdo","↖ Sup Esq"),("superior_direito","↗ Sup Dir"),
        ("inferior_esquerdo","↙ Inf Esq"),("inferior_direito","↘ Inf Dir"),("centro","⊕ Centro"),
    ]
    lp = []
    for i in range(0, len(pos_list), 3):
        lp.append([
            Button.inline(
                (E_OK + " " + lbl) if slug == IA_CONFIG["img_posicao"] else lbl,
                ("img_pos|" + slug).encode()
            ) for slug, lbl in pos_list[i:i+3]
        ])
    return [
        [Button.inline(at, b"ia_img_toggle")],
        [Button.inline(E_LOGO + " Upload logo",  b"img_upload_logo"),
         Button.inline(E_VER  + " " + lg,        b"img_ver_logo")],
        *lp,
        [Button.inline(E_MAIS + " Escala: "  + str(IA_CONFIG["img_escala"])   + "%", b"img_escala"),
         Button.inline(E_MAIS + " Opac: "    + str(IA_CONFIG["img_opacidade"])+ "%", b"img_opacidade")],
        [Button.inline(E_CAM    + " Testar com foto",  b"img_testar"),
         Button.inline(E_LIMPAR + " Remover logo",     b"img_rm_logo")],
        [Button.inline("🎨 Efeitos", b"ia_img_efeitos")],
        [Button.inline(E_VOLTAR + " Voltar", b"m_ia")],
    ]


def kb_ia_img_efeitos():
    filtro = IA_CONFIG.get("img_filtro", "nenhum")
    txt_at = "✏ Texto: ON" if IA_CONFIG.get("img_texto_ativo") else "✏ Texto: OFF"
    borda_at = "🖼 Borda: ON" if IA_CONFIG.get("img_borda_ativo") else "🖼 Borda: OFF"

    def fbt(label, val):
        return Button.inline((E_OK+" "+label) if filtro==val else label, ("img_filtro|"+val).encode())

    return [
        [fbt("nenhum","nenhum"), fbt("P&B","bw"), fbt("vintage","vintage"),
         fbt("bright","bright"), fbt("contraste","contrast")],
        [Button.inline(txt_at, b"img_txt_toggle")],
        [Button.inline("🔤 Editar texto",  b"img_txt_editar"),
         Button.inline("🎨 Cor texto",     b"img_txt_cor"),
         Button.inline("📐 Tamanho",       b"img_txt_tamanho")],
        [Button.inline(borda_at, b"img_borda_toggle")],
        [Button.inline("🎨 Cor borda",     b"img_borda_cor"),
         Button.inline("📏 Espessura",     b"img_borda_espessura")],
        [Button.inline(E_VOLTAR + " Voltar", b"ia_img_menu")],
    ]


def kb_admin():
    return [
        [Button.inline("➕ Criar novo bot",   b"adm_criar"),
         Button.inline("📋 Listar bots",      b"adm_listar")],
        [Button.inline("▶ Iniciar bot",       b"adm_sel_start"),
         Button.inline("⏹ Parar bot",         b"adm_sel_stop")],
        [Button.inline("🔄 Reiniciar bot",    b"adm_sel_restart"),
         Button.inline("📄 Ver logs",          b"adm_sel_logs")],
        [Button.inline("⚙ Config limites",    b"adm_limites"),
         Button.inline("🗑 Deletar bot",       b"adm_sel_rm")],
        [Button.inline(E_VOLTAR + " Voltar ao menu", b"m_back")],
    ]


def kb_admin_bot(nome):
    n = nome.encode()
    return [
        [Button.inline("▶ Iniciar",   b"adm_op|start|"  + n),
         Button.inline("⏹ Parar",    b"adm_op|stop|"   + n),
         Button.inline("🔄 Reiniciar",b"adm_op|restart|"+ n)],
        [Button.inline("📄 Logs",     b"adm_op|logs|"   + n),
         Button.inline("🗑 Deletar",  b"adm_op|rm|"     + n)],
        [Button.inline(E_VOLTAR + " Voltar", b"adm_listar")],
    ]


def kb_tipo_selector(ctx):
    c    = ctx.encode()
    back = {"src":b"m_origens","src_rem":b"m_origens","src_ign":b"m_origens",
            "dst":b"m_destinos","dst_rem":b"m_destinos"}.get(ctx,b"disc_menu")
    return [
        [Button.inline(E_USER+    " User",   c+b"|user"),
         Button.inline(E_VIP+     " Premium",c+b"|premium"),
         Button.inline(E_BOT2+    " Bot",    c+b"|bot")],
        [Button.inline(E_GROUP+   " Grupos", c+b"|mygroup"),
         Button.inline(E_CHANNEL+ " Canais", c+b"|mychannel"),
         Button.inline(E_FORUM+   " Forums", c+b"|myforum")],
        [Button.inline(E_MANUAL+  " Digitar ID manual", c+b"|manual")],
        [Button.inline(E_VOLTAR+  " Voltar", back)],
    ]


def kb_lista_chats(items, ctx, cat, pagina=0):
    inicio = pagina * POR_PAG
    bloco  = items[inicio:inicio+POR_PAG]
    linhas = []
    for item in bloco:
        un = "  @" + item["username"] if item.get("username") else ""
        linhas.append([Button.inline(item["name"]+un, f"{ctx}|sel|{item['id']}|{cat}".encode())])
    nav = []
    if pagina > 0:
        nav.append(Button.inline(E_VOLTAR+" Anterior", f"{ctx}|pg|{cat}|{pagina-1}".encode()))
    if inicio+POR_PAG < len(items):
        nav.append(Button.inline("Proxima "+E_PROX, f"{ctx}|pg|{cat}|{pagina+1}".encode()))
    if nav: linhas.append(nav)
    linhas.append([Button.inline(E_MANUAL+" Manual", f"{ctx}|manual".encode()),
                   Button.inline(E_VOLTAR+" Voltar",  f"{ctx}|back".encode())])
    return linhas


def kb_disc_lista(items, cat, pagina=0):
    inicio = pagina * POR_PAG
    bloco  = items[inicio:inicio+POR_PAG]
    linhas = []
    for item in bloco:
        un = "  @" + item["username"] if item.get("username") else ""
        linhas.append([Button.inline(item["name"]+un, ("disc_show|"+str(item["id"])).encode())])
    nav = []
    if pagina > 0:
        nav.append(Button.inline(E_VOLTAR+" Anterior", ("disc|"+cat+"|"+str(pagina-1)).encode()))
    if inicio+POR_PAG < len(items):
        nav.append(Button.inline("Proxima "+E_PROX, ("disc|"+cat+"|"+str(pagina+1)).encode()))
    if nav: linhas.append(nav)
    linhas.append([Button.inline(E_MANUAL+" Buscar @username", b"disc|manual"),
                   Button.inline(E_VOLTAR+" Voltar",           b"disc_menu")])
    return linhas


def kb_origens():
    return [
        [Button.inline(E_MAIS+   " Adicionar origem",  b"src|tipo"),
         Button.inline(E_MENOS+  " Remover origem",    b"src_rem|tipo")],
        [Button.inline(E_FECHAR+ " Ignorar chat",      b"src_ign|tipo"),
         Button.inline(E_OK+     " Designorar",        b"o_des")],
        [Button.inline(E_VER+    " Ver origens",       b"o_list"),
         Button.inline(E_LIMPAR+ " Limpar tudo",       b"o_clear")],
        [Button.inline(E_VOLTAR+ " Voltar",            b"m_back")],
    ]


def kb_destinos():
    return [
        [Button.inline(E_MAIS+   " Adicionar destino", b"dst|tipo"),
         Button.inline(E_MENOS+  " Remover destino",   b"dst_rem|tipo")],
        [Button.inline(E_VER+    " Ver destinos",      b"d_list"),
         Button.inline(E_LIMPAR+ " Limpar destinos",   b"d_clear")],
        [Button.inline(E_VOLTAR+ " Voltar",            b"m_back")],
    ]


def kb_modo():
    bt = "Ignorar bots: SIM" if SEM_BOTS else "Ignorar bots: NAO"
    return [
        [Button.inline(">> Forward (mostra origem)", b"mo_fwd"),
         Button.inline(">> Copy (sem origem)",       b"mo_copy")],
        [Button.inline(E_BOT2+   " " + bt,           b"mo_bots")],
        [Button.inline(E_HORARIO+" Delay",            b"mo_delay"),
         Button.inline(E_FILTRO+ " Tipos de midia",  b"mo_tipos")],
        [Button.inline(E_VOLTAR+ " Voltar",           b"m_back")],
    ]


def kb_filtros():
    return [
        [Button.inline(E_MAIS+   " Exigir palavra",   b"f_add_on"),
         Button.inline(E_FECHAR+ " Bloquear palavra", b"f_add_off")],
        [Button.inline(E_MENOS+  " Remover filtro",   b"f_rem"),
         Button.inline(E_VER+    " Ver filtros",      b"f_list")],
        [Button.inline(E_LIMPAR+ " Limpar filtros",   b"f_clear"),
         Button.inline(E_VOLTAR+ " Voltar",           b"m_back")],
    ]


def kb_agenda():
    at = "ATIVO" if AGENDAMENTO["ativo"] else "INATIVO"
    return [
        [Button.inline(E_HORARIO+" Definir horario",       b"ag_set"),
         Button.inline(E_STATUS+ " Agendamento: "+at,      b"ag_toggle")],
        [Button.inline(E_VER+    " Ver configuracao",      b"ag_ver"),
         Button.inline(E_VOLTAR+ " Voltar",                b"m_back")],
    ]


def kb_msg():
    return [
        [Button.inline(E_MAIS+   " Definir prefixo", b"mg_prefix"),
         Button.inline(E_MAIS+   " Definir rodape",  b"mg_suffix")],
        [Button.inline(E_MENOS+  " Remover prefixo", b"mg_rmpre"),
         Button.inline(E_MENOS+  " Remover rodape",  b"mg_rmsuf")],
        [Button.inline(E_VER+    " Ver config",       b"mg_ver"),
         Button.inline(E_VOLTAR+ " Voltar",           b"m_back")],
    ]


def kb_tipos():
    tipos = ["texto","foto","video","audio","doc","sticker"]
    linhas = []
    for i in range(0,len(tipos),3):
        linhas.append([Button.inline((E_OK if t in SOMENTE_TIPOS else "[ ]")+" "+t,
                                     ("tp_"+t).encode()) for t in tipos[i:i+3]])
    linhas.append([Button.inline(E_LIMPAR+" Todos (sem filtro)", b"tp_clear"),
                   Button.inline(E_VOLTAR+" Voltar",             b"mo_tipos_back")])
    return linhas


def kb_info():
    return [
        [Button.inline("Ping",              b"i_ping"),
         Button.inline(E_ID+" ID chat",     b"i_id")],
        [Button.inline(E_STATUS+" Stats",   b"i_stats"),
         Button.inline(E_LIMPAR+" Zerar",   b"i_reset")],
        [Button.inline(E_OK+" Testar destinos", b"i_teste"),
         Button.inline(E_VOLTAR+" Voltar",       b"m_back")],
    ]


# ════════════════════════════════════════════════════════════════════════════
#  COMANDOS
# ════════════════════════════════════════════════════════════════════════════

@bot.on(events.NewMessage(pattern=r"^/start$"))
async def cmd_start(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(
        "Olá! Sou o " + BOT_NOME + ".\n\n"
        "/menu   — painel completo\n"
        "/ia     — inteligência artificial\n"
        "/logo   — enviar logo para substituição em imagens\n"
        "/admin  — painel admin de revenda\n"
        "/backup — exportar configuração\n"
        "/restore — importar configuração\n\n"
        "Dica: digite @" + (BOT_NOME.lower().replace(" ","")) + " no campo de mensagem "
        "para acessar qualquer menu sem abrir o chat."
    )


@bot.on(events.NewMessage(pattern=r"^/menu$"))
async def cmd_menu(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(painel_txt(), buttons=kb_principal())


@bot.on(events.NewMessage(pattern=r"^/status$"))
async def cmd_status(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(status_texto())


@bot.on(events.NewMessage(pattern=r"^/ia$"))
async def cmd_ia(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(ia_config_texto(), buttons=kb_ia())


@bot.on(events.NewMessage(pattern=r"^/logo$"))
async def cmd_logo(ev):
    if not is_admin(ev.sender_id): return
    AGUARDANDO[ev.sender_id] = "img_upload_logo"
    await ev.respond(
        E_LOGO + " Envie agora a imagem PNG da sua logo.\n"
        "Recomendado: PNG com fundo transparente (canal alpha).\n"
        "A logo será sobreposta nas fotos encaminhadas."
    )


@bot.on(events.NewMessage(pattern=r"^/admin$"))
async def cmd_admin(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(admin_txt(), buttons=kb_admin())


@bot.on(events.NewMessage(pattern=r"^/backup$"))
async def cmd_backup(ev):
    if not is_admin(ev.sender_id): return
    cfg = {
        "destinos":    list(DESTINOS),
        "origens":     list(SRC),
        "ignorados":   list(IGNORADOS),
        "filtros_on":  list(FILTROS_ON),
        "filtros_off": list(FILTROS_OFF),
        "mod":         MOD,
        "prefixo":     PREFIXO,
        "rodape":      RODAPE,
        "delay":       DELAY,
        "sem_bots":    SEM_BOTS,
        "agendamento": AGENDAMENTO,
        "somente_tipos": list(SOMENTE_TIPOS),
        "ia": {k: v for k, v in IA_CONFIG.items() if k not in ("img_logo","api_key_oai","api_key_gem")},
        "reseller_bots": RESELLER_BOTS,
        "exportado_em": datetime.now().isoformat(),
    }
    buf = io.BytesIO(json.dumps(cfg, ensure_ascii=False, indent=2).encode())
    buf.name = f"backup_{BOT_NOME}_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    await bot.send_file(ev.chat_id, buf, caption="💾 Backup gerado com sucesso.")


@bot.on(events.NewMessage(pattern=r"^/restore$"))
async def cmd_restore(ev):
    if not is_admin(ev.sender_id): return
    AGUARDANDO[ev.sender_id] = "restore_json"
    await ev.respond("📥 Envie o arquivo .json de backup agora.")


# ════════════════════════════════════════════════════════════════════════════
#  INLINE QUERY — todos os menus acessíveis via @bot no campo de mensagem
# ════════════════════════════════════════════════════════════════════════════

@bot.on(events.InlineQuery)
async def inline_handler(ev):
    if not is_admin(ev.sender_id):
        await ev.answer([], cache_time=0); return

    q       = (ev.text or "").strip().lower()
    builder = ev.builder
    results = []

    def art(title, desc, text, buttons):
        return builder.article(title=title, description=desc, text=text, buttons=buttons)

    # Painel principal
    if not q or any(x in q for x in ("menu","painel","home","inicio","principal")):
        results.append(art(
            E_HOME + " Painel de Controle", "Menu principal completo",
            painel_txt(), kb_principal()
        ))

    # Status
    if not q or any(x in q for x in ("status","stats","estat","uptime")):
        results.append(art(
            E_STATUS + " Status", "Estatísticas e estado atual",
            status_texto(),
            [[Button.inline("🔄 Atualizar", b"m_status"),
              Button.inline(E_HOME+" Menu",  b"m_back")]]
        ))

    # IA texto+imagem
    if not q or any(x in q for x in ("ia","intelig","openai","gemini","gpt","ai")):
        results.append(art(
            E_IA + " Inteligência Artificial", "Texto e imagem · OpenAI · Gemini",
            ia_config_texto(), kb_ia()
        ))

    # IA imagem
    if not q or any(x in q for x in ("imagem","logo","foto","marca","watermark","brand")):
        results.append(art(
            E_IMG + " IA de Imagem", "Substituir/sobrepor logo em fotos",
            ia_img_texto(), kb_ia_img()
        ))

    # Admin revenda
    if not q or any(x in q for x in ("admin","revend","resell","bot filho","deploy")):
        results.append(art(
            "⚙️ Admin Revenda", "Criar e gerenciar bots filhos",
            admin_txt(), kb_admin()
        ))

    # Backup
    if not q or any(x in q for x in ("backup","exportar","salvar config")):
        results.append(art(
            "💾 Backup", "Exportar configuração atual",
            "Use /backup para gerar o arquivo de backup.",
            [[Button.inline(E_HOME+" Menu", b"m_back")]]
        ))

    # Restore
    if not q or any(x in q for x in ("restore","importar","restaurar")):
        results.append(art(
            "📥 Restore", "Importar configuração salva",
            "Use /restore e envie o arquivo .json.",
            [[Button.inline(E_HOME+" Menu", b"m_back")]]
        ))

    # Origens
    if not q or any(x in q for x in ("origem","source","monit","fonte")):
        lista = ", ".join(str(x) for x in SRC) if SRC else "todos os chats"
        results.append(art(
            E_ORIGEM + " Origens", "Grupos monitorados · " + str(len(SRC)) + " configurados",
            E_ORIGEM + " ORIGENS\n" + "="*20 + "\nAtivas: " + lista + "\nIgnorados: " + str(len(IGNORADOS)),
            kb_origens()
        ))

    # Destinos
    if not q or any(x in q for x in ("destino","dest","enviar","target")):
        lista = ", ".join(str(x) for x in DESTINOS) if DESTINOS else "nenhum"
        results.append(art(
            E_DESTINO + " Destinos", "Grupos de destino · " + str(len(DESTINOS)) + " configurados",
            E_DESTINO + " DESTINOS\n" + "="*20 + "\nAtivos (" + str(len(DESTINOS)) + "): " + lista,
            kb_destinos()
        ))

    # Modo
    if not q or any(x in q for x in ("modo","mode","copy","forward","delay","midia")):
        results.append(art(
            E_MODO + " Modo de encaminhamento", "Forward/Copy · Delay · Tipos de mídia",
            E_MODO + " MODO\n" + "="*20 + "\nAtual: " + MOD
            + "\nDelay: " + str(DELAY) + "s  |  Sem bots: " + ("SIM" if SEM_BOTS else "NAO"),
            kb_modo()
        ))

    # Filtros
    if not q or any(x in q for x in ("filtro","palavra","bloquear","exigir","block")):
        results.append(art(
            E_FILTRO + " Filtros", "Exigir/bloquear palavras",
            E_FILTRO + " FILTROS\n" + "="*20
            + "\nExigidas: "   + str(FILTROS_ON  or "nenhuma")
            + "\nBloqueadas: " + str(FILTROS_OFF or "nenhuma"),
            kb_filtros()
        ))

    # Agendamento
    if not q or any(x in q for x in ("horario","agenda","schedule","hora","time")):
        at = "ATIVO" if AGENDAMENTO["ativo"] else "INATIVO"
        results.append(art(
            E_HORARIO + " Agendamento", "Janela de funcionamento · " + at,
            E_HORARIO + " HORARIO\n" + "="*20 + "\nEstado: " + at
            + "\nJanela: " + AGENDAMENTO["inicio"] + " ate " + AGENDAMENTO["fim"],
            kb_agenda()
        ))

    # Mensagem
    if not q or any(x in q for x in ("mensagem","prefixo","rodape","assinatura","texto")):
        results.append(art(
            E_MSG + " Prefixo / Rodapé", "Texto antes e depois das mensagens",
            E_MSG + " MENSAGEM\n" + "="*20
            + "\nPrefixo: " + (PREFIXO or "nenhum")
            + "\nRodape: "  + (RODAPE  or "nenhum"),
            kb_msg()
        ))

    # Histórico
    if not q or any(x in q for x in ("hist","log","recente","ultim")):
        if HISTORICO:
            t = E_HIST + " Ultimas mensagens:\n" + "".join(
                h["time"] + " — " + h["chat"] + "\n" for h in HISTORICO[-10:])
        else:
            t = "Nenhuma mensagem encaminhada ainda."
        results.append(art(
            E_HIST + " Histórico", "Últimas " + str(len(HISTORICO)) + " mensagens",
            t, [[Button.inline(E_VOLTAR+" Menu", b"m_back")]]
        ))

    # Descobrir ID
    if not q or any(x in q for x in ("id","descobrir","grupo","canal","user","buscar")):
        results.append(art(
            E_ID + " Descobrir ID", "Grupos · Canais · Usuários · Bots",
            E_ID + " DESCOBRIR ID\n" + "="*20 + "\nEscolha o tipo:",
            [
                [Button.inline(E_GROUP+  " Grupos",  b"disc|mygroup|0"),
                 Button.inline(E_CHANNEL+" Canais",  b"disc|mychannel|0")],
                [Button.inline(E_USER+   " Users",   b"disc|user|0"),
                 Button.inline(E_FORUM+  " Forums",  b"disc|myforum|0")],
                [Button.inline(E_MANUAL+ " @username ou ID", b"disc|manual"),
                 Button.inline(E_HOME+   " Menu",    b"m_back")],
            ]
        ))

    # Info / Ping
    if not q or any(x in q for x in ("info","ping","id chat","teste")):
        results.append(art(
            E_INFO + " Info / Ping", "Ping · ID do chat · Testar destinos",
            E_INFO + " INFO", kb_info()
        ))

    # Pausar / Retomar
    if not q or any(x in q for x in ("paus","retom","stop","ligar","desligar","toggle")):
        label = E_RETOMAR + " Retomar" if PAUSADO else E_PAUSAR + " Pausar"
        results.append(art(
            label, "Estado: " + ("PAUSADO" if PAUSADO else "ATIVO"),
            painel_txt(),
            [[Button.inline(label, b"m_toggle"), Button.inline(E_HOME+" Menu", b"m_back")]]
        ))

    await ev.answer(results[:20], cache_time=0, private=True)


# ════════════════════════════════════════════════════════════════════════════
#  ENTRADA LIVRE
# ════════════════════════════════════════════════════════════════════════════

@bot.on(events.NewMessage())
async def entrada_usuario(ev):
    global PREFIXO, RODAPE, DELAY, MOD, SEM_BOTS, PAUSADO, MODO_SILENCIOSO
    global RESELLER_BOTS
    uid = ev.sender_id
    if not is_admin(uid): return

    # ── Restore JSON ─────────────────────────────────────────────────────
    if uid in AGUARDANDO and AGUARDANDO[uid] == "restore_json":
        if ev.document:
            AGUARDANDO.pop(uid)
            msg_p = await ev.respond("📥 Carregando backup...")
            try:
                raw = await ev.download_media(bytes)
                cfg = json.loads(raw.decode("utf-8"))
                # Restaurar variáveis globais
                DESTINOS.clear();    DESTINOS.update(int(x) for x in cfg.get("destinos", []))
                SRC.clear();         SRC.update(int(x) for x in cfg.get("origens", []))
                IGNORADOS.clear();   IGNORADOS.update(int(x) for x in cfg.get("ignorados", []))
                FILTROS_ON.clear();  FILTROS_ON.update(cfg.get("filtros_on", []))
                FILTROS_OFF.clear(); FILTROS_OFF.update(cfg.get("filtros_off", []))
                MOD         = cfg.get("mod", MOD)
                PREFIXO     = cfg.get("prefixo", PREFIXO)
                RODAPE      = cfg.get("rodape", RODAPE)
                DELAY       = cfg.get("delay", DELAY)
                SEM_BOTS    = cfg.get("sem_bots", SEM_BOTS)
                SOMENTE_TIPOS.clear(); SOMENTE_TIPOS.update(cfg.get("somente_tipos", []))
                if "agendamento" in cfg:
                    AGENDAMENTO.update(cfg["agendamento"])
                if "ia" in cfg:
                    for k, v in cfg["ia"].items():
                        if k in IA_CONFIG and k not in ("img_logo",):
                            IA_CONFIG[k] = v
                if "reseller_bots" in cfg:
                    RESELLER_BOTS.update(cfg["reseller_bots"])
                exp = cfg.get("exportado_em", "?")
                await msg_p.edit(
                    E_OK + " Backup restaurado com sucesso!\nExportado em: " + exp,
                    buttons=[[Button.inline(E_HOME+" Menu", b"m_back")]]
                )
            except Exception as e:
                await msg_p.edit(E_FECHAR + " Erro ao restaurar backup: " + str(e))
            return
        elif ev.text and not ev.text.startswith("/"):
            await ev.respond("Envie o arquivo .json de backup.",
                             buttons=[[Button.inline(E_FECHAR+" Cancelar", b"m_back")]])
            return

    # ── Upload de logo (foto ou documento PNG) ────────────────────────────
    if uid in AGUARDANDO and AGUARDANDO[uid] == "img_upload_logo":
        if ev.photo or ev.document:
            AGUARDANDO.pop(uid)
            msg_p = await ev.respond(E_IA + " Salvando logo...")
            try:
                img_bytes = await ev.download_media(bytes)
                from PIL import Image as _PI
                pil = _PI.open(io.BytesIO(img_bytes))
                IA_CONFIG["img_logo"]      = img_bytes
                IA_CONFIG["img_logo_nome"] = (
                    getattr(ev.document.attributes[0], "file_name", "logo.png")
                    if ev.document and ev.document.attributes else "logo.png"
                )
                w, h = pil.size
                await msg_p.edit(
                    E_OK + " Logo salva!\nArquivo: " + IA_CONFIG["img_logo_nome"]
                    + "\nTamanho: " + str(w) + "x" + str(h) + "px",
                    buttons=[[Button.inline(E_IMG+" Config Imagem", b"ia_img_menu"),
                               Button.inline(E_HOME+" Menu",        b"m_back")]]
                )
            except Exception as e:
                await msg_p.edit(E_FECHAR + " Erro ao salvar logo: " + str(e))
            return
        elif ev.text and ev.text not in ("/logo", "/menu", "/ia", "/status", "/start", "/admin", "/backup", "/restore"):
            await ev.respond("Envie uma imagem PNG.",
                             buttons=[[Button.inline(E_FECHAR+" Cancelar", b"m_back")]])
            return

    # ── Foto de teste ────────────────────────────────────────────────────
    if uid in AGUARDANDO and AGUARDANDO[uid] == "img_testar":
        if ev.photo or ev.document:
            AGUARDANDO.pop(uid)
            if not IA_CONFIG["img_logo"] and not IA_CONFIG.get("img_texto_ativo") and not IA_CONFIG.get("img_borda_ativo") and IA_CONFIG.get("img_filtro","nenhum") == "nenhum":
                await ev.respond(E_FECHAR+" Nenhum efeito ativo. Configure logo, filtro, texto ou borda.",
                                 buttons=[[Button.inline(E_VOLTAR+" Voltar", b"ia_img_menu")]])
                return
            msg_p = await ev.respond(E_IA + " Processando imagem de teste...")
            try:
                img_bytes = await ev.download_media(bytes)
                res = processar_imagem(img_bytes)
                if res:
                    await bot.send_file(ev.chat_id, res, caption=E_OK + " Resultado com efeitos aplicados")
                    await msg_p.delete()
                else:
                    await msg_p.edit(E_FECHAR + " Erro. Verifique se Pillow está instalada.")
            except Exception as e:
                await msg_p.edit(E_FECHAR + " Erro: " + str(e))
            return

    if uid not in AGUARDANDO: return
    acao = AGUARDANDO.pop(uid)
    txt  = ev.raw_text.strip()

    def parse_ids(t):
        return [x.strip() for x in re.split(r"[,; ]+", t) if x.strip().lstrip("-").isdigit()]

    if   acao == "src|manual":      [SRC.add(int(i)) for i in parse_ids(txt)];         await ev.respond("Origens: "  + str(parse_ids(txt)), buttons=kb_origens())
    elif acao == "src_rem|manual":  [SRC.discard(int(i)) for i in parse_ids(txt)];     await ev.respond("Removidas: "+ str(parse_ids(txt)), buttons=kb_origens())
    elif acao == "src_ign|manual":  [IGNORADOS.add(int(i)) for i in parse_ids(txt)];   await ev.respond("Ignorando: "+ str(parse_ids(txt)), buttons=kb_origens())
    elif acao == "dst|manual":      [DESTINOS.add(int(i)) for i in parse_ids(txt)];    await ev.respond("Destinos: " + str(parse_ids(txt)), buttons=kb_destinos())
    elif acao == "dst_rem|manual":  [DESTINOS.discard(int(i)) for i in parse_ids(txt)];await ev.respond("Removidos: "+ str(parse_ids(txt)), buttons=kb_destinos())
    elif acao == "disc_manual":
        try:
            ent  = await userbot.get_entity(txt)
            eid  = getattr(ent, "id", None)
            nome = getattr(ent, "title", None) or getattr(ent, "first_name", "?")
            un   = getattr(ent, "username", None)
            tipo = ("Forum" if isinstance(ent,Channel) and getattr(ent,"forum",False) else
                    "Canal" if isinstance(ent,Channel) and ent.broadcast else
                    "Grupo" if isinstance(ent,(Channel,Chat)) else
                    "Bot"   if isinstance(ent,User) and ent.bot else "Usuario")
            r = "Tipo: "+tipo+"\nNome: "+nome+"\nID: "+str(eid)+(("\n@"+un) if un else "")
            await ev.respond(r, buttons=[[Button.inline(E_ID+" Outro",b"disc_menu"),
                                          Button.inline(E_HOME+" Menu",b"m_back")]])
        except Exception as e:
            await ev.respond("Nao encontrado: " + str(e))
    elif acao == "mg_prefix":   PREFIXO = txt; await ev.respond("Prefixo: "+PREFIXO, buttons=kb_msg())
    elif acao == "mg_suffix":   RODAPE  = txt; await ev.respond("Rodape: " +RODAPE,  buttons=kb_msg())
    elif acao == "mo_delay":
        if txt.isdigit(): DELAY = int(txt); await ev.respond("Delay: "+str(DELAY)+"s", buttons=kb_modo())
    elif acao == "f_add_on":  FILTROS_ON.add(txt.lower());  await ev.respond("Exigida: " +txt, buttons=kb_filtros())
    elif acao == "f_add_off": FILTROS_OFF.add(txt.lower()); await ev.respond("Bloqueada: "+txt, buttons=kb_filtros())
    elif acao == "f_rem":     FILTROS_ON.discard(txt.lower()); FILTROS_OFF.discard(txt.lower()); await ev.respond("Removido: "+txt, buttons=kb_filtros())
    elif acao == "ag_set":
        p = txt.split()
        if len(p)==2:
            AGENDAMENTO["inicio"]=p[0]; AGENDAMENTO["fim"]=p[1]
            await ev.respond("Horario: "+p[0]+" ate "+p[1], buttons=kb_agenda())
        else: await ev.respond("Formato: HH:MM HH:MM")
    elif acao == "ia_key_openai":  IA_CONFIG["api_key_oai"]=txt; await ev.respond(E_OK+" Key OpenAI salva!",  buttons=kb_ia())
    elif acao == "ia_key_gemini":  IA_CONFIG["api_key_gem"]=txt; await ev.respond(E_OK+" Key Gemini salva!",  buttons=kb_ia())
    elif acao == "ia_prompt":
        IA_CONFIG["prompt"]=txt
        IA_CONFIG["modo"]="personalizado"
        PROMPTS_PADRAO["personalizado"]=txt
        await ev.respond(E_OK+" Prompt salvo!", buttons=kb_ia())
    elif acao == "ia_prompt_c2":
        IA_CONFIG["prompt"]=txt
        IA_CONFIG["modo"]="personalizado_2"
        PROMPTS_PADRAO["personalizado_2"]=txt
        await ev.respond(E_OK+" Prompt Custom 2 salvo!", buttons=kb_ia())
    elif acao == "ia_prompt_c3":
        IA_CONFIG["prompt"]=txt
        IA_CONFIG["modo"]="personalizado_3"
        PROMPTS_PADRAO["personalizado_3"]=txt
        await ev.respond(E_OK+" Prompt Custom 3 salvo!", buttons=kb_ia())
    elif acao == "ia_nome_c2":
        IA_CONFIG["personalizado_2_nome"]=txt
        await ev.respond(E_OK+" Nome Custom 2: "+txt, buttons=kb_ia())
    elif acao == "ia_nome_c3":
        IA_CONFIG["personalizado_3_nome"]=txt
        await ev.respond(E_OK+" Nome Custom 3: "+txt, buttons=kb_ia())
    elif acao == "ia_model_openai":IA_CONFIG["modelo_oai"]=txt; await ev.respond(E_OK+" Modelo OAI: "+txt, buttons=kb_ia())
    elif acao == "ia_model_gemini":IA_CONFIG["modelo_gem"]=txt; await ev.respond(E_OK+" Modelo GEM: "+txt, buttons=kb_ia())
    elif acao == "ia_test":
        m = await ev.respond(E_IA+" Processando..."); r = await processar_com_ia(txt)
        if r: await m.edit(E_OK+" Resultado:\n"+"="*20+"\n"+r, buttons=[[Button.inline(E_VOLTAR+" Voltar",b"m_ia")]])
        else: await m.edit(E_FECHAR+" Erro. Verifique a API Key.", buttons=[[Button.inline(E_VOLTAR+" Voltar",b"m_ia")]])
    elif acao == "img_escala":
        if txt.isdigit() and 1<=int(txt)<=80: IA_CONFIG["img_escala"]=int(txt); await ev.respond(E_OK+" Escala: "+txt+"%", buttons=kb_ia_img())
        else: await ev.respond("Digite 1-80.")
    elif acao == "img_opacidade":
        if txt.isdigit() and 0<=int(txt)<=100: IA_CONFIG["img_opacidade"]=int(txt); await ev.respond(E_OK+" Opacidade: "+txt+"%", buttons=kb_ia_img())
        else: await ev.respond("Digite 0-100.")
    elif acao == "img_txt_editar":
        IA_CONFIG["img_texto"] = txt
        await ev.respond(E_OK+" Texto definido: "+txt, buttons=kb_ia_img_efeitos())
    elif acao == "img_txt_cor":
        if re.match(r"^#[0-9A-Fa-f]{3,6}$", txt):
            IA_CONFIG["img_texto_cor"] = txt
            await ev.respond(E_OK+" Cor do texto: "+txt, buttons=kb_ia_img_efeitos())
        else:
            await ev.respond("Formato: #RRGGBB (ex: #FFFFFF)")
    elif acao == "img_txt_tamanho":
        if txt.isdigit() and 8<=int(txt)<=200:
            IA_CONFIG["img_texto_tamanho"] = int(txt)
            await ev.respond(E_OK+" Tamanho: "+txt+"px", buttons=kb_ia_img_efeitos())
        else:
            await ev.respond("Digite 8-200.")
    elif acao == "img_borda_cor":
        if re.match(r"^#[0-9A-Fa-f]{3,6}$", txt):
            IA_CONFIG["img_borda_cor"] = txt
            await ev.respond(E_OK+" Cor da borda: "+txt, buttons=kb_ia_img_efeitos())
        else:
            await ev.respond("Formato: #RRGGBB (ex: #000000)")
    elif acao == "img_borda_espessura":
        if txt.isdigit() and 1<=int(txt)<=100:
            IA_CONFIG["img_borda_espessura"] = int(txt)
            await ev.respond(E_OK+" Espessura: "+txt+"px", buttons=kb_ia_img_efeitos())
        else:
            await ev.respond("Digite 1-100.")
    # ── Admin: estados de criação de bot filho ────────────────────────────
    elif acao == "adm_nome":
        nome_bot = txt.strip().replace(" ", "_")
        if not nome_bot or not re.match(r"^[a-zA-Z0-9_]+$", nome_bot):
            await ev.respond("Nome inválido. Use apenas letras, números e underscore.")
            AGUARDANDO[uid] = "adm_nome"
            return
        if nome_bot in RESELLER_BOTS:
            await ev.respond("Já existe um bot com esse nome. Escolha outro.")
            AGUARDANDO[uid] = "adm_nome"
            return
        RESELLER_BOTS[nome_bot] = {"token": "", "container": "", "ativo": False,
                                    "criado": datetime.now().isoformat(), "admin_ids": [uid],
                                    "session": ""}
        AGUARDANDO[uid] = "adm_token_" + nome_bot
        await ev.respond(
            "✅ Nome: " + nome_bot + "\n\n"
            "Agora envie o BOT TOKEN obtido no @BotFather:\n"
            "(formato: 123456789:ABCDefgh...)"
        )
    elif acao.startswith("adm_token_"):
        nome_bot = acao[len("adm_token_"):]
        token = txt.strip()
        if not re.match(r"^\d+:[A-Za-z0-9_-]+$", token):
            await ev.respond("Token inválido. Tente novamente.")
            AGUARDANDO[uid] = acao
            return
        RESELLER_BOTS[nome_bot]["token"] = token
        AGUARDANDO[uid] = "adm_session_" + nome_bot
        await ev.respond(
            "✅ Token salvo.\n\n"
            "Envie a SESSION STRING do Telegram do cliente\n"
            "(ou envie /pular para configurar depois)."
        )
    elif acao.startswith("adm_session_"):
        nome_bot = acao[len("adm_session_"):]
        session = "" if txt == "/pular" else txt.strip()
        RESELLER_BOTS[nome_bot]["session"] = session
        cfg = RESELLER_BOTS[nome_bot]
        resumo = (
            "📋 RESUMO DO BOT\n" + "="*24 + "\n"
            "Nome   : " + nome_bot + "\n"
            "Token  : ***" + cfg["token"][-8:] + "\n"
            "Session: " + ("configurada" if session else "não configurada") + "\n"
            "Criado : " + cfg["criado"][:16]
        )
        await ev.respond(resumo, buttons=[
            [Button.inline("▶ Deploy agora", ("adm_deploy|"+nome_bot).encode()),
             Button.inline("✅ Salvar sem deploy", ("adm_nodeploy|"+nome_bot).encode())],
            [Button.inline(E_VOLTAR+" Admin", b"adm_menu")],
        ])


# ════════════════════════════════════════════════════════════════════════════
#  CALLBACKS
# ════════════════════════════════════════════════════════════════════════════

@bot.on(events.CallbackQuery)
async def callback(ev):
    global PAUSADO, MOD, SEM_BOTS, MODO_SILENCIOSO
    if not is_admin(ev.sender_id): await ev.answer("Sem permissao!", alert=True); return

    d   = ev.data
    uid = ev.sender_id

    # ── Navegação ─────────────────────────────────────────────────────────
    if   d == b"m_back":       await ev.edit(painel_txt(), buttons=kb_principal())
    elif d == b"m_origens":
        lista = ", ".join(str(x) for x in SRC) if SRC else "todos os chats"
        await ev.edit(E_ORIGEM+" ORIGENS\n"+"="*20+"\nAtivas: "+lista+"\nIgnorados: "+str(len(IGNORADOS)), buttons=kb_origens())
    elif d == b"m_destinos":
        lista = ", ".join(str(x) for x in DESTINOS) if DESTINOS else "nenhum"
        await ev.edit(E_DESTINO+" DESTINOS\n"+"="*20+"\nAtivos ("+str(len(DESTINOS))+"): "+lista, buttons=kb_destinos())
    elif d == b"m_modo":
        await ev.edit(E_MODO+" MODO\n"+"="*20+"\nAtual: "+MOD+"\nDelay: "+str(DELAY)+"s  |  Sem bots: "+("SIM" if SEM_BOTS else "NAO"), buttons=kb_modo())
    elif d == b"m_filtros":
        await ev.edit(E_FILTRO+" FILTROS\n"+"="*20+"\nExigidas: "+str(FILTROS_ON or "nenhuma")+"\nBloqueadas: "+str(FILTROS_OFF or "nenhuma"), buttons=kb_filtros())
    elif d == b"m_agenda":
        at = "ATIVO" if AGENDAMENTO["ativo"] else "INATIVO"
        await ev.edit(E_HORARIO+" HORARIO\n"+"="*20+"\nEstado: "+at+"\nJanela: "+AGENDAMENTO["inicio"]+" ate "+AGENDAMENTO["fim"], buttons=kb_agenda())
    elif d == b"m_msg":
        await ev.edit(E_MSG+" MENSAGEM\n"+"="*20+"\nPrefixo: "+(PREFIXO or "nenhum")+"\nRodape: "+(RODAPE or "nenhum"), buttons=kb_msg())
    elif d == b"m_info":   await ev.edit(E_INFO+" INFO\n"+"="*20, buttons=kb_info())
    elif d == b"m_hist":
        t = (E_HIST+" Ultimas:\n"+"".join(h["time"]+" — "+h["chat"]+"\n" for h in HISTORICO[-15:])) if HISTORICO else "Nenhuma mensagem ainda."
        await ev.edit(t, buttons=[[Button.inline(E_VOLTAR+" Voltar",b"m_back")]])
    elif d == b"m_status":
        await ev.edit(status_texto(), buttons=[[Button.inline("🔄 Atualizar",b"m_status"),Button.inline(E_VOLTAR+" Voltar",b"m_back")]])
    elif d == b"m_fechar":    await ev.delete()
    elif d == b"m_toggle":    PAUSADO=not PAUSADO; await ev.edit(painel_txt(), buttons=kb_principal()); await ev.answer("PAUSADO!" if PAUSADO else "RETOMADO!", alert=True)
    elif d == b"m_silencioso":MODO_SILENCIOSO=not MODO_SILENCIOSO; await ev.edit(painel_txt(), buttons=kb_principal()); await ev.answer("Silencioso ON" if MODO_SILENCIOSO else "Silencioso OFF", alert=True)

    # ── IA ─────────────────────────────────────────────────────────────────
    elif d == b"m_ia":        await ev.edit(ia_config_texto(), buttons=kb_ia())
    elif d == b"ia_toggle":
        IA_CONFIG["ativo"]=not IA_CONFIG["ativo"]; await ev.edit(ia_config_texto(), buttons=kb_ia())
        await ev.answer("IA ATIVADA!" if IA_CONFIG["ativo"] else "IA DESATIVADA!", alert=True)
    elif d == b"ia_img_toggle":
        if not _pillow_ok(): await ev.answer("Pillow nao instalada.", alert=True); return
        IA_CONFIG["img_ativo"]=not IA_CONFIG["img_ativo"]; await ev.edit(ia_config_texto(), buttons=kb_ia())
        await ev.answer("IA IMAGEM ON!" if IA_CONFIG["img_ativo"] else "IA IMAGEM OFF", alert=True)
    elif d == b"ia_img_menu": await ev.edit(ia_img_texto(), buttons=kb_ia_img())
    elif d == b"ia_img_efeitos": await ev.edit(ia_img_efeitos_texto(), buttons=kb_ia_img_efeitos())
    elif d.startswith(b"ia_prov|"):
        IA_CONFIG["provedor"]=d.decode().split("|")[1]; await ev.edit(ia_config_texto(), buttons=kb_ia())
    elif d.startswith(b"ia_modo|"):
        m=d.decode().split("|")[1]; IA_CONFIG["modo"]=m
        if m in PROMPTS_PADRAO and m not in ("personalizado","personalizado_2","personalizado_3"):
            IA_CONFIG["prompt"]=PROMPTS_PADRAO[m]
        elif m in ("personalizado_2","personalizado_3") and PROMPTS_PADRAO.get(m):
            IA_CONFIG["prompt"]=PROMPTS_PADRAO[m]
        await ev.edit(ia_config_texto(), buttons=kb_ia()); await ev.answer("Modo: "+m)
    elif d.startswith(b"ia_key|"):
        AGUARDANDO[uid]="ia_key_"+d.decode().split("|")[1]
        await ev.answer("Digite a API Key:", alert=True)
    elif d.startswith(b"ia_model|"):
        p=d.decode().split("|")[1]; AGUARDANDO[uid]="ia_model_"+p
        await ev.answer("Modelo atual: "+(IA_CONFIG["modelo_oai"] if p=="openai" else IA_CONFIG["modelo_gem"])+"\nDigite o novo:", alert=True)
    elif d == b"ia_prompt":  AGUARDANDO[uid]="ia_prompt"; await ev.answer("Digite o prompt para [personalizado]:", alert=True)
    elif d == b"ia_prompt_c2": AGUARDANDO[uid]="ia_prompt_c2"; await ev.answer("Digite o prompt para Custom 2:", alert=True)
    elif d == b"ia_prompt_c3": AGUARDANDO[uid]="ia_prompt_c3"; await ev.answer("Digite o prompt para Custom 3:", alert=True)
    elif d == b"ia_nome_c2": AGUARDANDO[uid]="ia_nome_c2"; await ev.answer("Digite o nome para Custom 2:", alert=True)
    elif d == b"ia_nome_c3": AGUARDANDO[uid]="ia_nome_c3"; await ev.answer("Digite o nome para Custom 3:", alert=True)
    elif d == b"ia_ver":     await ev.edit(ia_config_texto(), buttons=[[Button.inline(E_VOLTAR+" Voltar",b"m_ia")]])
    elif d == b"ia_test":    AGUARDANDO[uid]="ia_test"; await ev.answer("Digite mensagem de teste:", alert=True)

    # ── IA Imagem ──────────────────────────────────────────────────────────
    elif d.startswith(b"img_pos|"):
        IA_CONFIG["img_posicao"]=d.decode().split("|")[1]; await ev.edit(ia_img_texto(), buttons=kb_ia_img())
    elif d == b"img_escala":     AGUARDANDO[uid]="img_escala";    await ev.answer("Escala % (1-80). Atual: "+str(IA_CONFIG["img_escala"]),    alert=True)
    elif d == b"img_opacidade":  AGUARDANDO[uid]="img_opacidade"; await ev.answer("Opacidade % (0-100). Atual: "+str(IA_CONFIG["img_opacidade"]),alert=True)
    elif d == b"img_upload_logo":AGUARDANDO[uid]="img_upload_logo"; await ev.answer("Envie agora a imagem PNG da logo!", alert=True)
    elif d == b"img_ver_logo":
        if IA_CONFIG["img_logo"]: await ev.answer("Logo: "+IA_CONFIG["img_logo_nome"]+" | "+str(len(IA_CONFIG["img_logo"]))+" bytes", alert=True)
        else: await ev.answer("Nenhuma logo. Use /logo.", alert=True)
    elif d == b"img_rm_logo":
        IA_CONFIG["img_logo"]=b""; IA_CONFIG["img_logo_nome"]=""; IA_CONFIG["img_ativo"]=False
        await ev.edit(ia_img_texto(), buttons=kb_ia_img()); await ev.answer("Logo removida.", alert=True)
    elif d == b"img_testar":
        AGUARDANDO[uid]="img_testar"; await ev.answer("Envie uma foto para testar!", alert=True)
    # Efeitos de imagem
    elif d.startswith(b"img_filtro|"):
        IA_CONFIG["img_filtro"] = d.decode().split("|")[1]
        await ev.edit(ia_img_efeitos_texto(), buttons=kb_ia_img_efeitos())
        await ev.answer("Filtro: " + IA_CONFIG["img_filtro"])
    elif d == b"img_txt_toggle":
        IA_CONFIG["img_texto_ativo"] = not IA_CONFIG.get("img_texto_ativo", False)
        await ev.edit(ia_img_efeitos_texto(), buttons=kb_ia_img_efeitos())
        await ev.answer("Texto ON" if IA_CONFIG["img_texto_ativo"] else "Texto OFF", alert=True)
    elif d == b"img_txt_editar":
        AGUARDANDO[uid] = "img_txt_editar"
        await ev.answer("Digite o texto a sobrepor na imagem:", alert=True)
    elif d == b"img_txt_cor":
        AGUARDANDO[uid] = "img_txt_cor"
        await ev.answer("Cor do texto em hex (ex: #FFFFFF). Atual: " + IA_CONFIG.get("img_texto_cor","#FFFFFF"), alert=True)
    elif d == b"img_txt_tamanho":
        AGUARDANDO[uid] = "img_txt_tamanho"
        await ev.answer("Tamanho do texto em px (8-200). Atual: " + str(IA_CONFIG.get("img_texto_tamanho",24)), alert=True)
    elif d == b"img_borda_toggle":
        IA_CONFIG["img_borda_ativo"] = not IA_CONFIG.get("img_borda_ativo", False)
        await ev.edit(ia_img_efeitos_texto(), buttons=kb_ia_img_efeitos())
        await ev.answer("Borda ON" if IA_CONFIG["img_borda_ativo"] else "Borda OFF", alert=True)
    elif d == b"img_borda_cor":
        AGUARDANDO[uid] = "img_borda_cor"
        await ev.answer("Cor da borda em hex (ex: #000000). Atual: " + IA_CONFIG.get("img_borda_cor","#000000"), alert=True)
    elif d == b"img_borda_espessura":
        AGUARDANDO[uid] = "img_borda_espessura"
        await ev.answer("Espessura da borda px (1-100). Atual: " + str(IA_CONFIG.get("img_borda_espessura",5)), alert=True)

    # ── Admin de Revenda ────────────────────────────────────────────────────
    elif d == b"adm_menu":
        await ev.edit(admin_txt(), buttons=kb_admin())
    elif d == b"adm_criar":
        AGUARDANDO[uid] = "adm_nome"
        await ev.answer("Digite um nome único para o bot (ex: cliente1):", alert=True)
    elif d == b"adm_listar":
        if not RESELLER_BOTS:
            await ev.edit("📋 Nenhum bot cadastrado.", buttons=[[Button.inline(E_VOLTAR+" Voltar",b"adm_menu")]])
        else:
            linhas = []
            for nome, cfg in RESELLER_BOTS.items():
                status_icon = "▶" if cfg.get("ativo") else "⏹"
                linhas.append([Button.inline(status_icon + " " + nome, ("adm_bot|"+nome).encode())])
            linhas.append([Button.inline(E_VOLTAR+" Voltar", b"adm_menu")])
            await ev.edit("📋 BOTS CADASTRADOS (" + str(len(RESELLER_BOTS)) + "):", buttons=linhas)
    elif d.startswith(b"adm_bot|"):
        nome_bot = d.decode().split("|",1)[1]
        if nome_bot not in RESELLER_BOTS:
            await ev.answer("Bot não encontrado.", alert=True); return
        cfg = RESELLER_BOTS[nome_bot]
        info = (
            "🤖 BOT: " + nome_bot + "\n" + "="*20 + "\n"
            "Estado : " + ("▶ Ativo" if cfg.get("ativo") else "⏹ Parado") + "\n"
            "Token  : ***" + cfg.get("token","")[-8:] + "\n"
            "Cont.  : " + (cfg.get("container","") or "não implantado") + "\n"
            "Criado : " + cfg.get("criado","")[:16]
        )
        await ev.edit(info, buttons=kb_admin_bot(nome_bot))
    elif d.startswith(b"adm_op|"):
        parts = d.decode().split("|")
        op, nome_bot = parts[1], parts[2]
        msg_p = await ev.edit("⏳ Executando " + op + " em userbot-" + nome_bot + "...")
        resultado = await bot_op(nome_bot, op)
        if op == "rm" and nome_bot in RESELLER_BOTS:
            RESELLER_BOTS[nome_bot]["ativo"] = False
            RESELLER_BOTS[nome_bot]["container"] = ""
        elif op == "start" and nome_bot in RESELLER_BOTS:
            RESELLER_BOTS[nome_bot]["ativo"] = True
        elif op == "stop" and nome_bot in RESELLER_BOTS:
            RESELLER_BOTS[nome_bot]["ativo"] = False
        await ev.edit(
            "⚙️ " + op.upper() + " → " + nome_bot + "\n" + "="*20 + "\n" + (resultado or "(sem saída)"),
            buttons=kb_admin_bot(nome_bot) if nome_bot in RESELLER_BOTS else [[Button.inline(E_VOLTAR+" Admin",b"adm_menu")]]
        )
    elif d.startswith(b"adm_deploy|"):
        nome_bot = d.decode().split("|",1)[1]
        if nome_bot not in RESELLER_BOTS:
            await ev.answer("Bot não encontrado.", alert=True); return
        await ev.edit("⏳ Fazendo deploy do bot " + nome_bot + "...")
        ok, out = await deploy_bot_filho(nome_bot, RESELLER_BOTS[nome_bot])
        if ok:
            RESELLER_BOTS[nome_bot]["ativo"] = True
            RESELLER_BOTS[nome_bot]["container"] = out
            await ev.edit(
                E_OK + " Deploy concluído!\nContêiner: " + out,
                buttons=kb_admin_bot(nome_bot)
            )
        else:
            await ev.edit(
                E_FECHAR + " Erro no deploy:\n" + out,
                buttons=[[Button.inline(E_VOLTAR+" Admin", b"adm_menu")]]
            )
    elif d.startswith(b"adm_nodeploy|"):
        nome_bot = d.decode().split("|",1)[1]
        await ev.edit(
            E_OK + " Bot " + nome_bot + " salvo sem deploy.\nUse o painel para implantá-lo depois.",
            buttons=kb_admin()
        )
    elif d == b"adm_limites":
        await ev.edit(
            "⚙️ LIMITES PADRÃO\n" + "="*20 + "\n"
            "Max destinos: " + str(RESELLER_LIMITE["max_destinos"]) + "\n"
            "Max origens : " + str(RESELLER_LIMITE["max_origens"]) + "\n"
            "IA permitida: " + ("SIM" if RESELLER_LIMITE["ia_permitida"] else "NAO") + "\n"
            "Expira em   : " + (RESELLER_LIMITE["expira_em"] or "sem expiração"),
            buttons=[[Button.inline(E_VOLTAR+" Voltar", b"adm_menu")]]
        )
    elif d in (b"adm_sel_start",b"adm_sel_stop",b"adm_sel_restart",b"adm_sel_logs",b"adm_sel_rm"):
        op_map = {b"adm_sel_start":"start",b"adm_sel_stop":"stop",
                  b"adm_sel_restart":"restart",b"adm_sel_logs":"logs",b"adm_sel_rm":"rm"}
        op = op_map[d]
        if not RESELLER_BOTS:
            await ev.answer("Nenhum bot cadastrado.", alert=True); return
        linhas = []
        for nome in RESELLER_BOTS:
            linhas.append([Button.inline(nome, ("adm_op|"+op+"|"+nome).encode())])
        linhas.append([Button.inline(E_VOLTAR+" Voltar", b"adm_menu")])
        await ev.edit("Selecione o bot para " + op + ":", buttons=linhas)

    # ── Tipo selector ──────────────────────────────────────────────────────
    elif d in (b"src|tipo",b"src_rem|tipo",b"src_ign|tipo",b"dst|tipo",b"dst_rem|tipo"):
        ctx=d.decode().split("|")[0]
        lm={"src":"ADICIONAR ORIGEM","src_rem":"REMOVER ORIGEM","src_ign":"IGNORAR CHAT","dst":"ADICIONAR DESTINO","dst_rem":"REMOVER DESTINO"}
        await ev.edit(lm.get(ctx,"SELECIONAR")+"\n"+"="*20+"\nEscolha o tipo:", buttons=kb_tipo_selector(ctx))

    # ── Paginação ──────────────────────────────────────────────────────────
    elif b"|pg|" in d:
        p=d.decode().split("|"); ctx,cat,pag=p[0],p[2],int(p[3])
        await ev.answer("Carregando...", alert=False)
        dialogs=await get_dialogs_safe(); items=dialogs.get(cat,[])
        if not items: await ev.answer("Nenhum "+cat+" encontrado.", alert=True); return
        await ev.edit(cat.upper()+" ("+str(len(items))+") — pag "+str(pag+1)+"\nSelecione:", buttons=kb_lista_chats(items,ctx,cat,pag))

    # ── Seleção ────────────────────────────────────────────────────────────
    elif d.count(b"|")>=3 and d.split(b"|")[1]==b"sel":
        p=d.decode().split("|"); ctx,cid,cat=p[0],int(p[2]),p[3]
        dialogs=await get_dialogs_safe(); all_i=[i for its in dialogs.values() for i in its]
        item=next((i for i in all_i if i["id"]==cid),None); nome=item["name"] if item else str(cid)
        am={"src":(SRC.add,E_OK+" ORIGEM ADICIONADA","m_origens","src|tipo","Adicionar outra"),
            "dst":(DESTINOS.add,E_OK+" DESTINO ADICIONADO","m_destinos","dst|tipo","Adicionar outro"),
            "src_rem":(SRC.discard,E_MENOS+" ORIGEM REMOVIDA","m_origens",None,None),
            "dst_rem":(DESTINOS.discard,E_MENOS+" DESTINO REMOVIDO","m_destinos",None,None),
            "src_ign":(IGNORADOS.add,E_FECHAR+" CHAT IGNORADO","m_origens",None,None)}
        if ctx in am:
            fn,titulo,bc,ac,at=am[ctx]; fn(cid); bts=[]
            if ac and at: bts.append([Button.inline(E_MAIS+" "+at, ac.encode())])
            bts.append([Button.inline(E_VOLTAR+" Voltar",bc.encode()),Button.inline(E_HOME+" Menu",b"m_back")])
            await ev.edit(titulo+"\n"+"="*20+"\n"+nome+"\nID: "+str(cid), buttons=bts)

    # ── Voltar listas ──────────────────────────────────────────────────────
    elif b"|back" in d:
        ctx=d.decode().split("|")[0]
        if ctx in ("src","src_rem","src_ign"): await ev.edit(E_ORIGEM+" ORIGENS",  buttons=kb_origens())
        elif ctx in ("dst","dst_rem"):          await ev.edit(E_DESTINO+" DESTINOS",buttons=kb_destinos())
        else: await ev.edit(E_ID+" DESCOBRIR ID", buttons=[[Button.inline(E_VOLTAR+" Menu",b"m_back")]])

    # ── Manual ─────────────────────────────────────────────────────────────
    elif b"|manual" in d and not d.startswith(b"disc"):
        AGUARDANDO[uid]=d.decode().split("|")[0]+"|manual"; await ev.answer("Digite o @username ou ID:", alert=True)

    # ── Lista por tipo ──────────────────────────────────────────────────────
    elif (b"|" in d and d.split(b"|")[1] in (b"user",b"premium",b"bot",b"mygroup",b"mychannel",b"myforum")
          and not d.startswith(b"disc")):
        p=d.decode().split("|"); ctx,cat=p[0],p[1]
        await ev.answer("Carregando...", alert=False)
        dialogs=await get_dialogs_safe(); items=dialogs.get(cat,[])
        if not items: await ev.answer("Nenhum "+cat+" encontrado.", alert=True); return
        await ev.edit(cat.upper()+" ("+str(len(items))+") — pag 1\nSelecione:", buttons=kb_lista_chats(items,ctx,cat,0))

    # ── Descobrir ID ───────────────────────────────────────────────────────
    elif d == b"disc_menu":
        await ev.edit(E_ID+" DESCOBRIR ID\n"+"="*20+"\nEscolha o tipo:", buttons=[
            [Button.inline(E_USER+   " User",   b"disc|user|0"),
             Button.inline(E_VIP+    " Premium",b"disc|premium|0"),
             Button.inline(E_BOT2+   " Bot",    b"disc|bot|0")],
            [Button.inline(E_GROUP+  " Grupos", b"disc|mygroup|0"),
             Button.inline(E_CHANNEL+" Canais", b"disc|mychannel|0"),
             Button.inline(E_FORUM+  " Forums", b"disc|myforum|0")],
            [Button.inline(E_MANUAL+" Buscar @username / ID", b"disc|manual")],
            [Button.inline(E_VOLTAR+" Voltar", b"m_back")],
        ])
    elif d == b"disc|manual": AGUARDANDO[uid]="disc_manual"; await ev.answer("Digite @username ou ID:", alert=True)
    elif d.startswith(b"disc|") and d!=b"disc|manual":
        p=d.decode().split("|"); cat=p[1]; pag=int(p[2]) if len(p)>2 else 0
        await ev.answer("Carregando...", alert=False)
        dialogs=await get_dialogs_safe(); items=dialogs.get(cat,[])
        if not items: await ev.answer("Nenhum "+cat+" encontrado.", alert=True); return
        await ev.edit(cat.upper()+" ("+str(len(items))+") — pag "+str(pag+1)+"\nToque para ver o ID:", buttons=kb_disc_lista(items,cat,pag))
    elif d.startswith(b"disc_show|"):
        cid=int(d.decode().split("|")[1]); dialogs=await get_dialogs_safe()
        all_i=[i for its in dialogs.values() for i in its]; item=next((i for i in all_i if i["id"]==cid),None)
        if item: await ev.answer(item["name"]+(("  @"+item["username"]) if item.get("username") else "")+"\nID: "+str(cid), alert=True)
        else: await ev.answer("ID: "+str(cid), alert=True)

    # ── Modo ───────────────────────────────────────────────────────────────
    elif d==b"mo_fwd":  MOD="forward"; await ev.edit(E_MODO+" Modo: FORWARD", buttons=kb_modo())
    elif d==b"mo_copy": MOD="copy";    await ev.edit(E_MODO+" Modo: COPY",    buttons=kb_modo())
    elif d==b"mo_bots": SEM_BOTS=not SEM_BOTS; await ev.edit(E_MODO+" MODO", buttons=kb_modo())
    elif d==b"mo_delay":AGUARDANDO[uid]="mo_delay"; await ev.answer("Delay em segundos:", alert=True)
    elif d==b"mo_tipos":     await ev.edit(E_FILTRO+" Tipos de midia:", buttons=kb_tipos())
    elif d==b"mo_tipos_back":await ev.edit(E_MODO+" MODO", buttons=kb_modo())

    # ── Tipos ──────────────────────────────────────────────────────────────
    elif d.startswith(b"tp_"):
        t=d.decode()[3:]
        if t=="clear": SOMENTE_TIPOS.clear()
        elif t in SOMENTE_TIPOS: SOMENTE_TIPOS.discard(t)
        else: SOMENTE_TIPOS.add(t)
        await ev.edit(E_FILTRO+" Tipos:", buttons=kb_tipos())

    # ── Filtros ────────────────────────────────────────────────────────────
    elif d==b"f_add_on":  AGUARDANDO[uid]="f_add_on";  await ev.answer("Palavra a exigir:",   alert=True)
    elif d==b"f_add_off": AGUARDANDO[uid]="f_add_off"; await ev.answer("Palavra a bloquear:", alert=True)
    elif d==b"f_rem":     AGUARDANDO[uid]="f_rem";     await ev.answer("Palavra a remover:",  alert=True)
    elif d==b"f_list":
        await ev.edit(E_FILTRO+" FILTROS\n"+"="*20+"\nExigidas: "+str(FILTROS_ON or "nenhuma")+"\nBloqueadas: "+str(FILTROS_OFF or "nenhuma"),
                      buttons=[[Button.inline(E_VOLTAR+" Voltar",b"m_filtros")]])
    elif d==b"f_clear": FILTROS_ON.clear(); FILTROS_OFF.clear(); await ev.edit(E_FILTRO+" Limpos.", buttons=kb_filtros())

    # ── Mensagem ───────────────────────────────────────────────────────────
    elif d==b"mg_prefix": AGUARDANDO[uid]="mg_prefix"; await ev.answer("Digite o prefixo:", alert=True)
    elif d==b"mg_suffix": AGUARDANDO[uid]="mg_suffix"; await ev.answer("Digite o rodape:",  alert=True)
    elif d==b"mg_rmpre":  PREFIXO=""; await ev.edit(E_MSG+" Prefixo removido.", buttons=kb_msg())
    elif d==b"mg_rmsuf":  RODAPE="";  await ev.edit(E_MSG+" Rodape removido.",  buttons=kb_msg())
    elif d==b"mg_ver":
        await ev.edit(E_MSG+" CONFIG\n"+"="*20+"\nPrefixo: "+(PREFIXO or "nenhum")+"\nRodape: "+(RODAPE or "nenhum"),
                      buttons=[[Button.inline(E_VOLTAR+" Voltar",b"m_msg")]])

    # ── Agendamento ────────────────────────────────────────────────────────
    elif d==b"ag_set":    AGUARDANDO[uid]="ag_set"; await ev.answer("HH:MM HH:MM (inicio fim)", alert=True)
    elif d==b"ag_toggle": AGENDAMENTO["ativo"]=not AGENDAMENTO["ativo"]; await ev.edit(E_HORARIO+" Agendamento: "+("ATIVO" if AGENDAMENTO["ativo"] else "INATIVO"), buttons=kb_agenda())
    elif d==b"ag_ver":
        await ev.edit(E_HORARIO+" HORARIO\n"+"="*20+"\nEstado: "+("ATIVO" if AGENDAMENTO["ativo"] else "INATIVO")+"\nJanela: "+AGENDAMENTO["inicio"]+" ate "+AGENDAMENTO["fim"],
                      buttons=[[Button.inline(E_VOLTAR+" Voltar",b"m_agenda")]])

    # ── Origens extras ─────────────────────────────────────────────────────
    elif d==b"o_des":   IGNORADOS.clear(); await ev.edit(E_OK+" Todos designorados.", buttons=kb_origens())
    elif d==b"o_list":
        await ev.edit(E_ORIGEM+" ORIGENS\n"+"="*20+"\n"+(", ".join(str(x) for x in SRC) if SRC else "todos"),
                      buttons=[[Button.inline(E_VOLTAR+" Voltar",b"m_origens")]])
    elif d==b"o_clear": SRC.clear(); IGNORADOS.clear(); await ev.edit(E_LIMPAR+" Limpos.", buttons=kb_origens())

    # ── Destinos extras ────────────────────────────────────────────────────
    elif d==b"d_list":
        await ev.edit(E_DESTINO+" DESTINOS\n"+"="*20+"\n"+(", ".join(str(x) for x in DESTINOS) if DESTINOS else "nenhum"),
                      buttons=[[Button.inline(E_VOLTAR+" Voltar",b"m_destinos")]])
    elif d==b"d_clear": DESTINOS.clear(); await ev.edit(E_LIMPAR+" Destinos limpos.", buttons=kb_destinos())

    # ── Info ───────────────────────────────────────────────────────────────
    elif d==b"i_ping":  await ev.answer("Pong! " + str(round((time.time())*1000%1000)) + "ms")
    elif d==b"i_id":    await ev.answer("Chat ID: "+str(ev.chat_id), alert=True)
    elif d==b"i_stats": await ev.edit(status_texto(), buttons=[[Button.inline(E_VOLTAR+" Voltar",b"m_info")]])
    elif d==b"i_reset": stats["n"]=0; stats["err"]=0; stats["por_hora"].clear(); await ev.answer("Stats zerados!", alert=True)
    elif d==b"i_teste":
        if not DESTINOS: await ev.answer("Nenhum destino!", alert=True)
        else:
            ok=0
            for dst in DESTINOS:
                try: await userbot.send_message(dst,"Teste — "+BOT_NOME); ok+=1
                except: pass
            await ev.answer("OK: "+str(ok)+"/"+str(len(DESTINOS))+" destinos.", alert=True)


# ════════════════════════════════════════════════════════════════════════════
#  FORWARDING COM IA (TEXTO + IMAGEM)
# ════════════════════════════════════════════════════════════════════════════

def dentro_do_horario():
    if not AGENDAMENTO["ativo"]: return True
    agora = datetime.now().strftime("%H:%M")
    return AGENDAMENTO["inicio"] <= agora <= AGENDAMENTO["fim"]


def tipo_permitido(msg):
    if not SOMENTE_TIPOS: return True
    if "texto"   in SOMENTE_TIPOS and msg.text and not msg.media: return True
    if "foto"    in SOMENTE_TIPOS and msg.photo:                   return True
    if "video"   in SOMENTE_TIPOS and msg.video:                   return True
    if "audio"   in SOMENTE_TIPOS and (msg.audio or msg.voice):    return True
    if "doc"     in SOMENTE_TIPOS and msg.document:                return True
    if "sticker" in SOMENTE_TIPOS and msg.sticker:                 return True
    return False


@userbot.on(events.NewMessage(incoming=True))
async def handler(event):
    global ultimo_envio
    try:
        if PAUSADO or not DESTINOS: return
        if not dentro_do_horario(): return
        if event.chat_id in DESTINOS or event.chat_id in IGNORADOS: return
        if SRC and event.chat_id not in SRC: return
        if not tipo_permitido(event.message): return
        if SEM_BOTS and event.sender and getattr(event.sender, "bot", False): return

        texto = (event.message.text or "").lower()
        if FILTROS_ON  and not any(p in texto for p in FILTROS_ON):  return
        if FILTROS_OFF and any(p in texto for p in FILTROS_OFF):     return

        if DELAY > 0:
            agora  = asyncio.get_event_loop().time()
            espera = DELAY - (agora - ultimo_envio)
            if espera > 0: await asyncio.sleep(espera)
            ultimo_envio = asyncio.get_event_loop().time()

        # IA texto
        texto_final = event.message.text or ""
        ia_txt_ok   = False
        if IA_CONFIG["ativo"] and texto_final.strip():
            res = await processar_com_ia(texto_final)
            if res: texto_final = res; ia_txt_ok = True

        # IA imagem
        img_processada = None
        ia_img_ok      = False
        if IA_CONFIG["img_ativo"] and event.message.photo:
            tem_efeito = (
                IA_CONFIG.get("img_logo") or
                IA_CONFIG.get("img_filtro","nenhum") != "nenhum" or
                IA_CONFIG.get("img_texto_ativo") or
                IA_CONFIG.get("img_borda_ativo")
            )
            if tem_efeito:
                try:
                    img_bytes      = await event.download_media(bytes)
                    img_processada = processar_imagem(img_bytes)
                    if img_processada: ia_img_ok = True
                except Exception as e:
                    logger.error("[IA-IMG] Download/proc: %s", e)

        def montar(base):
            pts = [x for x in [PREFIXO, base, RODAPE] if x]
            return "\n".join(pts).strip() or None

        # Envio
        ok = 0
        for dst in DESTINOS:
            try:
                if ia_img_ok and img_processada:
                    await userbot.send_file(dst, img_processada,
                                            caption=montar(texto_final) or "",
                                            force_document=False)
                elif ia_txt_ok or PREFIXO or RODAPE:
                    novo = montar(texto_final)
                    if novo:
                        if event.message.media and not ia_txt_ok:
                            await userbot.send_message(dst, novo, file=event.message.media)
                        else:
                            await userbot.send_message(dst, novo)
                    else:
                        await userbot.send_message(dst, event.message)
                elif MOD == "copy":
                    await userbot.send_message(dst, event.message)
                else:
                    await userbot.forward_messages(dst, event.message)
                ok += 1
            except Exception as e:
                stats["err"] += 1
                logger.error("Erro envio %s: %s", dst, e)

        if ok > 0:
            stats["n"] += 1
            stats["por_hora"][datetime.now().hour] += 1
            try:
                chat = await event.get_chat()
                name = getattr(chat, "title", None) or getattr(chat, "first_name", "?")
            except: name = str(event.chat_id)
            HISTORICO.append({"time": datetime.now().strftime("%H:%M"), "chat": name})
            if len(HISTORICO) > 200: HISTORICO.pop(0)
            if not MODO_SILENCIOSO:
                tags = ""
                if ia_txt_ok: tags += " [TXT:" + IA_CONFIG["provedor"].upper() + "]"
                if ia_img_ok: tags += " [IMG]"
                logger.info("[%s] #%s '%s'->%s dest%s", BOT_NOME, stats["n"], name, ok, tags)

    except Exception as e:
        stats["err"] += 1
        logger.error("Erro geral: %s", e)


# ════════════════════════════════════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════════════════════════════════════

async def main():
    await userbot.start()
    await bot.start(bot_token=BOT_TOKEN)
    me  = await userbot.get_me()
    bme = await bot.get_me()
    logger.info("[%s] Userbot: %s | Bot: @%s", BOT_NOME, me.first_name, bme.username)
    logger.info("Destinos=%s | Origens=%s | Modo=%s | IA-TXT=%s | IA-IMG=%s",
                DESTINOS, SRC or "todos", MOD,
                IA_CONFIG["provedor"] if IA_CONFIG["ativo"]    else "OFF",
                "ON"                  if IA_CONFIG["img_ativo"] else "OFF")
    asyncio.create_task(get_dialogs())
    await registrar_menu_comandos()
    await asyncio.gather(
        userbot.run_until_disconnected(),
        bot.run_until_disconnected(),
    )


asyncio.run(main())
