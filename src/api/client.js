/**
 * Thin fetch wrapper for the admin dashboard.
 *
 * API priority:
 * 1. localStorage('apiBaseUrl') - runtime override
 * 2. VITE_API_BASE_URL - build-time configuration
 * 3. Production API URL - final fallback
 *
 * The URL is automatically normalized so all of these work:
 *
 *   lightyellow-loris-506983.hostingersite.com
 *   https://lightyellow-loris-506983.hostingersite.com
 *   https://lightyellow-loris-506983.hostingersite.com/
 *
 * and become:
 *
 *   https://lightyellow-loris-506983.hostingersite.com
 */

const DEFAULT_API_BASE_URL =
  'https://lightyellow-loris-506983.hostingersite.com';


/* =========================================================
   API BASE URL
   ========================================================= */

function normalizeApiBaseUrl(url) {
  if (!url || typeof url !== 'string') {
    return DEFAULT_API_BASE_URL;
  }

  let base = url.trim();

  if (!base) {
    return DEFAULT_API_BASE_URL;
  }

  /*
   * If the user enters only:
   *
   * lightyellow-loris-506983.hostingersite.com
   *
   * automatically add HTTPS.
   */
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }

  /*
   * Remove trailing slash so:
   *
   * https://example.com/
   *
   * becomes:
   *
   * https://example.com
   */
  base = base.replace(/\/+$/, '');

  return base;
}


function getApiBaseUrl() {
  const savedUrl = localStorage.getItem('apiBaseUrl');

  const envUrl =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL
      : null;

  return normalizeApiBaseUrl(
    savedUrl || envUrl || DEFAULT_API_BASE_URL
  );
}


/* =========================================================
   TOKENS
   ========================================================= */

function getTokens() {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}


function setTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }

  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
}


export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}


/* =========================================================
   TOKEN REFRESH
   ========================================================= */

async function tryRefresh() {
  const { refreshToken } = getTokens();

  if (!refreshToken) {
    return false;
  }

  const base = getApiBaseUrl();

  try {
    const res = await fetch(
      `${base}/api/auth/refresh`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      }
    );

    if (!res.ok) {
      return false;
    }

    const data = await res.json();

    setTokens(data);

    return true;
  } catch (error) {
    return false;
  }
}


/* =========================================================
   GENERIC API REQUEST
   ========================================================= */

export async function apiRequest(
  path,
  {
    method = 'GET',
    body,
    retry = true,
  } = {}
) {
  const base = getApiBaseUrl();

  const { accessToken } = getTokens();

  let res;

  /*
   * Make sure path always starts with /
   *
   * Example:
   *
   * apiRequest('api/clients')
   *
   * becomes:
   *
   * /api/clients
   */
  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  const url = `${base}${normalizedPath}`;

  try {
    res = await fetch(
      url,
      {
        method,

        headers: {
          'Content-Type': 'application/json',

          ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
        },

        body:
          body !== undefined &&
          body !== null
            ? JSON.stringify(body)
            : undefined,
      }
    );
  } catch (error) {
    console.error(
      'API connection failed:',
      {
        url,
        error,
      }
    );

    throw new Error(
      'Unable to connect to company vault. Check the office network / API URL in Settings.'
    );
  }


  /* =======================================================
     ACCESS TOKEN EXPIRED
     ======================================================= */

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();

    if (refreshed) {
      return apiRequest(
        path,
        {
          method,
          body,
          retry: false,
        }
      );
    }

    clearSession();

    /*
     * Use the application login route.
     *
     * This is intentionally relative because the dashboard
     * itself is hosted by the frontend server.
     */
    window.location.href = '/login';

    throw new Error(
      'Session expired. Please log in again.'
    );
  }


  /* =======================================================
     RESPONSE
     ======================================================= */

  let data = null;

  try {
    data = await res.json();
  } catch {
    // Some responses may intentionally have no JSON body.
  }


  /* =======================================================
     API ERROR
     ======================================================= */

  if (!res.ok) {
    const message =
      data &&
      data.error &&
      data.error.message
        ? data.error.message
        : `Request failed (${res.status})`;

    throw new Error(message);
  }


  return data;
}


/* =========================================================
   API METHODS
   ========================================================= */

export const Api = {

  /* -------------------------------------------------------
     Settings
     ------------------------------------------------------- */

  getApiBaseUrl,

  setApiBaseUrl: (url) => {
    const normalized = normalizeApiBaseUrl(url);

    localStorage.setItem(
      'apiBaseUrl',
      normalized
    );

    return normalized;
  },


  /* -------------------------------------------------------
     Authentication
     ------------------------------------------------------- */

  login: async (email, password) => {
    const base = getApiBaseUrl();

    const res = await fetch(
      `${base}/api/auth/login`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        data &&
        data.error &&
        data.error.message
          ? data.error.message
          : 'Login failed'
      );
    }

    setTokens(data);

    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    );

    return data.user;
  },


  logout: async () => {
    const { refreshToken } = getTokens();

    try {
      if (refreshToken) {
        await apiRequest(
          '/api/auth/logout',
          {
            method: 'POST',

            body: {
              refreshToken,
            },
          }
        );
      }
    } catch {
      // Ignore logout network errors.
    }

    clearSession();
  },


  getCurrentUser: () => {
    try {
      return JSON.parse(
        localStorage.getItem('user') || 'null'
      );
    } catch {
      return null;
    }
  },


  isLoggedIn: () => {
    return !!localStorage.getItem('accessToken');
  },


  /* -------------------------------------------------------
     Current Employee
     ------------------------------------------------------- */

  getMe: async () => {
    const data = await apiRequest(
      '/api/auth/me'
    );

    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    );

    return data.user;
  },


  /* -------------------------------------------------------
     Dashboard
     ------------------------------------------------------- */

  getStats: () =>
    apiRequest(
      '/api/dashboard/stats'
    ),


  /* -------------------------------------------------------
     Clients
     ------------------------------------------------------- */

  listClients: (params = '') =>
    apiRequest(
      `/api/clients${params}`
    ),

  getClient: (id) =>
    apiRequest(
      `/api/clients/${id}`
    ),

  createClient: (payload) =>
    apiRequest(
      '/api/clients',
      {
        method: 'POST',
        body: payload,
      }
    ),

  updateClient: (id, payload) =>
    apiRequest(
      `/api/clients/${id}`,
      {
        method: 'PUT',
        body: payload,
      }
    ),

  deleteClient: (id) =>
    apiRequest(
      `/api/clients/${id}`,
      {
        method: 'DELETE',
      }
    ),


  /* -------------------------------------------------------
     Services
     ------------------------------------------------------- */

  listServices: () =>
    apiRequest(
      '/api/services'
    ),

  createService: (name) =>
    apiRequest(
      '/api/services',
      {
        method: 'POST',
        body: {
          name,
        },
      }
    ),

  deleteService: (id) =>
    apiRequest(
      `/api/services/${id}`,
      {
        method: 'DELETE',
      }
    ),


  /* -------------------------------------------------------
     Credentials
     ------------------------------------------------------- */

  listCredentials: (params = '') =>
    apiRequest(
      `/api/credentials${params}`
    ),

  createCredential: (payload) =>
    apiRequest(
      '/api/credentials',
      {
        method: 'POST',
        body: payload,
      }
    ),

  updateCredential: (id, payload) =>
    apiRequest(
      `/api/credentials/${id}`,
      {
        method: 'PUT',
        body: payload,
      }
    ),

  deleteCredential: (id) =>
    apiRequest(
      `/api/credentials/${id}`,
      {
        method: 'DELETE',
      }
    ),

  reactivateCredential: (id) =>
    apiRequest(
      `/api/credentials/${id}/reactivate`,
      {
        method: 'POST',
      }
    ),

  revealCredential: (id) =>
    apiRequest(
      `/api/credentials/${id}/reveal`,
      {
        method: 'POST',
      }
    ),

  copyCredential: (id) =>
    apiRequest(
      `/api/credentials/${id}/copy`,
      {
        method: 'POST',
      }
    ),


  /* -------------------------------------------------------
     Employees
     ------------------------------------------------------- */

  listEmployees: () =>
    apiRequest(
      '/api/employees'
    ),

  createEmployee: (payload) =>
    apiRequest(
      '/api/employees',
      {
        method: 'POST',
        body: payload,
      }
    ),

  updateEmployee: (id, payload) =>
    apiRequest(
      `/api/employees/${id}`,
      {
        method: 'PUT',
        body: payload,
      }
    ),

  resetEmployeePassword: (id) =>
    apiRequest(
      `/api/employees/${id}/reset-password`,
      {
        method: 'POST',
      }
    ),

  deleteEmployee: (id) =>
    apiRequest(
      `/api/employees/${id}`,
      {
        method: 'DELETE',
      }
    ),


  /* -------------------------------------------------------
     Audit Logs
     ------------------------------------------------------- */

  listAuditLogs: (params = '') =>
    apiRequest(
      `/api/audit-logs${params}`
    ),
};