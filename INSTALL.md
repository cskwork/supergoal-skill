# Install supergoal

<details>
<summary><strong>Claude Code</strong></summary>

### Install

```bash
claude plugin marketplace add cskwork/supergoal
claude plugin install supergoal@supergoal
```

Type `/supergoal`.

### Verify

```bash
claude plugin list
```

### Update

```bash
claude plugin marketplace update supergoal
```

### Uninstall

```bash
claude plugin uninstall supergoal
claude plugin marketplace remove supergoal
```

</details>

<details>
<summary><strong>Codex</strong></summary>

### Install

```bash
codex plugin marketplace add cskwork/supergoal --ref main
codex plugin add supergoal@supergoal
```

Type `$supergoal`.

### Verify

```bash
codex plugin list
```

### Uninstall

```bash
codex plugin remove supergoal
codex plugin marketplace remove supergoal
```

</details>

<details>
<summary><strong>Gemini CLI</strong></summary>

### Install (extension, always-on)

```bash
gemini extensions install https://github.com/cskwork/supergoal
```

### Install (command, opt-in)

```bash
mkdir -p ~/.gemini/commands
curl -fsSL https://raw.githubusercontent.com/cskwork/supergoal/main/skills/supergoal/agents/gemini.toml \
  -o ~/.gemini/commands/supergoal.toml
```

Type `/supergoal` in a new session.

### Verify

```bash
gemini extensions list
```

### Uninstall

```bash
gemini extensions uninstall supergoal
```

</details>

<details>
<summary><strong>Cursor, OpenCode, Amp, and other agent-skills harnesses</strong></summary>

### Install

```bash
npx skills add cskwork/supergoal
npx skills add cskwork/supergoal -g
```

Type `/supergoal` in a new agent chat.

### Verify

```bash
npx skills list
```

### Update

```bash
npx skills update supergoal
```

### Uninstall

```bash
npx skills remove supergoal
```

</details>

<details>
<summary><strong>Antigravity (agy)</strong></summary>

### Install

```bash
agy plugin install https://github.com/cskwork/supergoal
```

### Verify

```bash
agy plugin list
```

### Uninstall

```bash
agy plugin uninstall supergoal
```

</details>
