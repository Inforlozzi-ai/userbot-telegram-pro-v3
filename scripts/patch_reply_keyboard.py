from pathlib import Path

path = Path('/app/bot.py')
text = path.read_text(encoding='utf-8')

old = '''@bot.on(events.NewMessage(pattern=r"^/start$"))
async def cmd_start(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(
        "Olá! Sou o " + BOT_NOME + ".\\n\\n"
        "/menu   — painel completo\\n"
        "/ia     — inteligência artificial\\n"
        "/logo   — enviar logo para substituição em imagens\\n"
        "/admin  — painel admin de revenda\\n"
        "/backup — exportar configuração\\n"
        "/restore — importar configuração\\n\\n"
        "Dica: digite @" + (BOT_NOME.lower().replace(" ","")) + " no campo de mensagem "
        "para acessar qualquer menu sem abrir o chat."
    )
'''

new = '''def kb_barra_principal():
    """Teclado persistente na área de mensagens do Telegram."""
    return [
        [Button.text("📋 Painel", resize=True), Button.text("📊 Status", resize=True)],
        [Button.text("🧠 IA", resize=True), Button.text("🖼 Logo", resize=True)],
        [Button.text("⚙️ Admin", resize=True), Button.text("💾 Backup", resize=True)],
        [Button.text("📥 Restore", resize=True)],
    ]


@bot.on(events.NewMessage(pattern=r"^/start$"))
async def cmd_start(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(
        "Olá! Sou o " + BOT_NOME + ".\\n\\n"
        "Use o menu abaixo para controlar o bot."
    , buttons=kb_barra_principal())
'''

if old not in text:
    raise SystemExit('cmd_start block not found; refusing to patch')

text = text.replace(old, new, 1)

marker = '# ════════════════════════════════════════════════════════════════════════════\n#  ENTRADA LIVRE\n'
handlers = '''@bot.on(events.NewMessage(pattern=r"^📋 Painel$"))
async def barra_painel(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(painel_txt(), buttons=kb_principal())


@bot.on(events.NewMessage(pattern=r"^📊 Status$"))
async def barra_status(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(status_texto(), buttons=kb_barra_principal())


@bot.on(events.NewMessage(pattern=r"^🧠 IA$"))
async def barra_ia(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(ia_config_texto(), buttons=kb_ia())


@bot.on(events.NewMessage(pattern=r"^🖼 Logo$"))
async def barra_logo(ev):
    if not is_admin(ev.sender_id): return
    AGUARDANDO[ev.sender_id] = "img_upload_logo"
    await ev.respond(
        E_LOGO + " Envie agora a imagem PNG da sua logo.\\n"
        "Recomendado: PNG com fundo transparente."
    )


@bot.on(events.NewMessage(pattern=r"^⚙️ Admin$"))
async def barra_admin(ev):
    if not is_admin(ev.sender_id): return
    await ev.respond(admin_txt(), buttons=kb_admin())


@bot.on(events.NewMessage(pattern=r"^💾 Backup$"))
async def barra_backup(ev):
    if not is_admin(ev.sender_id): return
    await cmd_backup(ev)


@bot.on(events.NewMessage(pattern=r"^📥 Restore$"))
async def barra_restore(ev):
    if not is_admin(ev.sender_id): return
    await cmd_restore(ev)


'''

if handlers not in text:
    if marker not in text:
        raise SystemExit('entry marker not found; refusing to patch')
    text = text.replace(marker, handlers + marker, 1)

path.write_text(text, encoding='utf-8')
print('Reply keyboard patch applied successfully.')
