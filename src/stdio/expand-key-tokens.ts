const TOKEN_TO_SEQUENCE: Record<string, string> = {
	'<up>': '\x1b[A',
	'<down>': '\x1b[B',
	'<enter>': '\r',
	'<escape>': '\x1b',
};

export function expandKeyTokens(tokens: string): string {
	return tokens.replace(/<(?:up|down|enter|escape)>/gi, (token) => TOKEN_TO_SEQUENCE[token.toLowerCase()]);
}
