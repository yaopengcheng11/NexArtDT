const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

function buildApiUrl(path: string) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

async function parseErrorResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => null);
    if (data && typeof data.error === 'string') {
      if (data.error.includes('CONSUMER_SUSPENDED') || data.error.includes('has been suspended')) {
        return 'Gemini API Key 已被 Google 暂停，当前请求无法由 Gemini 处理。';
      }
      if (data.error.includes('fetch failed') || data.error.includes('UND_ERR_CONNECT_TIMEOUT') || data.error.includes('Connect Timeout Error')) {
        return 'AI 模型网络连接超时，当前环境暂时连不上模型接口。请配置可访问的代理或 OpenAI 兼容中转地址。';
      }
      return data.error;
    }
  } else {
    const text = await response.text().catch(() => '');
    if (text.includes('<!doctype html') || text.includes('<html')) {
      return 'AI 接口当前不可用：站点只部署了前端页面，未部署 /api 后端服务。';
    }
  }

  return `请求失败 (${response.status})`;
}

export async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json() as Promise<T>;
}
