# Relay handoff: resume the portfolio /loop build on the SECOND Claude account.
# The work lives in this same folder; this only swaps which Claude account drives it.
$env:CLAUDE_CONFIG_DIR = "C:\Users\USER\.claude-work"
Set-Location "C:\Users\USER\Downloads\Tariwei portfolio design"
claude "Resume the portfolio build. Read .relay/continue-a4772e4b.md - it is your Relay continuation contract from the previous account (which hit its session limit). Honor the DO NOT REDO section, start at Next Action, and work the Tasks Remaining in order. Same folder, same machine: the uncommitted WIP is intentional, build on it."
