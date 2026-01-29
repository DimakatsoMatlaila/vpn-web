"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Copy, Check, Lock, Unlock, Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  summary: string
  description: string
  tags: string[]
  auth: boolean
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, Response>
}

interface Parameter {
  name: string
  in: "query" | "path" | "header"
  required: boolean
  type: string
  description: string
  defaultValue?: string
}

interface RequestBody {
  contentType: string
  schema: Record<string, unknown>
  example: Record<string, unknown>
}

interface Response {
  description: string
  example?: Record<string, unknown>
}

const API_SPEC: {
  info: { title: string; version: string; description: string }
  servers: { url: string; description: string }[]
  endpoints: Endpoint[]
} = {
  info: {
    title: "Wits Cyber Authentication API",
    version: "1.0.0",
    description:
      "OAuth 2.0 Provider API for Moodle 5 and CTFd integration. All endpoints are public and can be tested directly.",
  },
  servers: [{ url: "", description: "Current Server" }],
  endpoints: [
    // OAuth Endpoints
    {
      method: "GET",
      path: "/api/oauth/.well-known/openid-configuration",
      summary: "OpenID Configuration",
      description:
        "Returns OpenID Connect discovery document for automatic client configuration. This is public and does not require authentication.",
      tags: ["OAuth"],
      auth: false,
      responses: {
        "200": {
          description: "OpenID Configuration",
          example: {
            issuer: "https://your-domain.com",
            authorization_endpoint: "https://your-domain.com/api/oauth/authorize",
            token_endpoint: "https://your-domain.com/api/oauth/token",
            userinfo_endpoint: "https://your-domain.com/api/oauth/userinfo",
          },
        },
      },
    },
    {
      method: "GET",
      path: "/api/oauth/userinfo",
      summary: "Get User Info",
      description: "Returns the authenticated user's profile information. Requires a valid access token.",
      tags: ["OAuth"],
      auth: true,
      parameters: [
        {
          name: "Authorization",
          in: "header",
          required: true,
          type: "string",
          description: "Bearer token",
          defaultValue: "Bearer demo-access-token",
        },
      ],
      responses: {
        "200": {
          description: "User profile",
          example: {
            sub: "demo-user-001",
            email: "student@students.wits.ac.za",
            email_verified: true,
            name: "Demo Student",
          },
        },
        "401": { description: "Unauthorized", example: { error: "invalid_token" } },
      },
    },
    // CTFd Endpoints
    {
      method: "POST",
      path: "/api/ctfd/auth/verify",
      summary: "Verify CTFd Credentials",
      description: "Verifies username and password for CTFd login. Requires X-CTFd-API-Key header.",
      tags: ["CTFd"],
      auth: true,
      parameters: [
        {
          name: "X-CTFd-API-Key",
          in: "header",
          required: true,
          type: "string",
          description: "CTFd API key",
          defaultValue: "demo-api-key",
        },
      ],
      requestBody: {
        contentType: "application/json",
        schema: { username: "string", password: "string" },
        example: { username: "demo_student", password: "DemoPass123!" },
      },
      responses: {
        "200": {
          description: "Authentication successful",
          example: {
            success: true,
            user: {
              id: "demo-user-001",
              username: "demo_student",
              email: "student@students.wits.ac.za",
              name: "Demo Student",
            },
          },
        },
        "401": {
          description: "Invalid credentials",
          example: { success: false, error: "Invalid username or password" },
        },
      },
    },
    {
      method: "GET",
      path: "/api/ctfd/users",
      summary: "Get User by Email/Username",
      description: "Looks up a user by email or username.",
      tags: ["CTFd"],
      auth: true,
      parameters: [
        {
          name: "X-CTFd-API-Key",
          in: "header",
          required: true,
          type: "string",
          description: "CTFd API key",
          defaultValue: "demo-api-key",
        },
        {
          name: "email",
          in: "query",
          required: false,
          type: "string",
          description: "User email",
          defaultValue: "student@students.wits.ac.za",
        },
        { name: "username", in: "query", required: false, type: "string", description: "CTFd username" },
      ],
      responses: {
        "200": {
          description: "User found",
          example: {
            success: true,
            user: {
              id: "demo-user-001",
              username: "demo_student",
              email: "student@students.wits.ac.za",
              name: "Demo Student",
            },
          },
        },
        "404": { description: "User not found", example: { success: false, error: "User not found" } },
      },
    },
    // Auth Endpoints
    {
      method: "POST",
      path: "/api/auth/register",
      summary: "Register User",
      description: "Registers a new user after Google OAuth authentication.",
      tags: ["Auth"],
      auth: false,
      requestBody: {
        contentType: "application/json",
        schema: {
          email: "string",
          googleId: "string",
          name: "string",
          picture: "string",
          password: "string",
        },
        example: {
          email: "newuser@students.wits.ac.za",
          googleId: "google-new-123",
          name: "New User",
          picture: "https://example.com/photo.jpg",
          password: "SecureP@ss123!",
        },
      },
      responses: {
        "200": {
          description: "Registration successful",
          example: { success: true, user: { id: "user-123", email: "newuser@students.wits.ac.za" } },
        },
        "400": { description: "Validation error", example: { error: "Password does not meet requirements" } },
        "409": { description: "User exists", example: { error: "User already exists" } },
      },
    },
    {
      method: "POST",
      path: "/api/auth/profile",
      summary: "Save User Profile",
      description: "Saves extended user profile information including CTFd username, student details, etc.",
      tags: ["Auth"],
      auth: false,
      requestBody: {
        contentType: "application/json",
        schema: {
          email: "string",
          googleId: "string",
          firstName: "string",
          lastName: "string",
          username: "string",
          sex: "string",
          studentNumber: "string",
          faculty: "string",
          yearOfStudy: "string",
        },
        example: {
          email: "student@students.wits.ac.za",
          googleId: "demo-123456",
          firstName: "Demo",
          lastName: "Student",
          username: "demo_student",
          sex: "prefer_not_to_say",
          studentNumber: "1234567",
          faculty: "Science",
          yearOfStudy: "3rd Year",
        },
      },
      responses: {
        "200": { description: "Profile saved", example: { success: true, message: "Profile saved successfully" } },
        "400": { description: "Validation error", example: { error: "Invalid username format", field: "username" } },
      },
    },
  ],
}

const methodColors: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  POST: "bg-green-500/10 text-green-500 border-green-500/20",
  PUT: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function SwaggerUI() {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [tryItStates, setTryItStates] = useState<
    Record<
      string,
      { loading: boolean; response: string | null; paramValues: Record<string, string>; bodyValue: string }
    >
  >({})

  const toggleEndpoint = (key: string) => {
    const newExpanded = new Set(expandedEndpoints)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedEndpoints(newExpanded)
  }

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(key)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const initTryIt = (key: string, endpoint: Endpoint) => {
    if (!tryItStates[key]) {
      const paramValues: Record<string, string> = {}
      endpoint.parameters?.forEach((p) => {
        paramValues[p.name] = p.defaultValue || ""
      })
      setTryItStates((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          response: null,
          paramValues,
          bodyValue: endpoint.requestBody ? JSON.stringify(endpoint.requestBody.example, null, 2) : "",
        },
      }))
    }
  }

  const updateParamValue = (key: string, paramName: string, value: string) => {
    setTryItStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        paramValues: { ...prev[key]?.paramValues, [paramName]: value },
      },
    }))
  }

  const updateBodyValue = (key: string, value: string) => {
    setTryItStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], bodyValue: value },
    }))
  }

  const executeRequest = async (key: string, endpoint: Endpoint) => {
    const state = tryItStates[key]
    if (!state) return

    setTryItStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], loading: true, response: null },
    }))

    try {
      // Build URL with query params
      let url = endpoint.path
      const queryParams = new URLSearchParams()
      const headers: Record<string, string> = {}

      endpoint.parameters?.forEach((param) => {
        const value = state.paramValues[param.name]
        if (value) {
          if (param.in === "query") {
            queryParams.append(param.name, value)
          } else if (param.in === "header") {
            headers[param.name] = value
          }
        }
      })

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }

      // Build request options
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          ...headers,
        },
      }

      if (endpoint.requestBody && state.bodyValue) {
        options.headers = { ...options.headers, "Content-Type": "application/json" }
        options.body = state.bodyValue
      }

      const response = await fetch(url, options)
      const data = await response.json()

      setTryItStates((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          loading: false,
          response: JSON.stringify({ status: response.status, data }, null, 2),
        },
      }))
    } catch (error) {
      setTryItStates((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          loading: false,
          response: JSON.stringify({ error: String(error) }, null, 2),
        },
      }))
    }
  }

  const groupedEndpoints = API_SPEC.endpoints.reduce(
    (acc, endpoint) => {
      const tag = endpoint.tags[0] || "Other"
      if (!acc[tag]) acc[tag] = []
      acc[tag].push(endpoint)
      return acc
    },
    {} as Record<string, Endpoint[]>,
  )

  return (
    <div className="space-y-8">
      {/* API Info */}
      <div className="p-6 rounded-lg bg-card border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-2">{API_SPEC.info.title}</h2>
        <p className="text-muted-foreground mb-4">{API_SPEC.info.description}</p>
        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant="outline" className="font-mono">
            v{API_SPEC.info.version}
          </Badge>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            Demo Mode Active
          </Badge>
        </div>
      </div>

      {/* Endpoints by Tag */}
      {Object.entries(groupedEndpoints).map(([tag, endpoints]) => (
        <div key={tag} className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            {tag}
            <Badge variant="secondary" className="text-xs">
              {endpoints.length}
            </Badge>
          </h3>

          <div className="space-y-2">
            {endpoints.map((endpoint, idx) => {
              const key = `${endpoint.method}-${endpoint.path}-${idx}`
              const isExpanded = expandedEndpoints.has(key)
              const curlExample = generateCurlExample(endpoint)
              const tryItState = tryItStates[key]

              return (
                <div key={key} className="border border-border rounded-lg overflow-hidden bg-card">
                  {/* Endpoint Header */}
                  <button
                    onClick={() => {
                      toggleEndpoint(key)
                      initTryIt(key, endpoint)
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <Badge className={cn("font-mono text-xs px-2 py-1 border", methodColors[endpoint.method])}>
                      {endpoint.method}
                    </Badge>
                    <code className="font-mono text-sm text-foreground flex-1 text-left">{endpoint.path}</code>
                    <span className="text-sm text-muted-foreground hidden sm:block">{endpoint.summary}</span>
                    {endpoint.auth ? (
                      <Lock className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-green-500" />
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4 bg-secondary/20">
                      <p className="text-muted-foreground">{endpoint.description}</p>

                      {/* Try It Section */}
                      <div className="p-4 rounded-lg bg-card border border-primary/20">
                        <h4 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Try It Out
                        </h4>

                        {/* Parameters */}
                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <div className="space-y-3 mb-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Parameters</p>
                            {endpoint.parameters.map((param) => (
                              <div key={param.name} className="flex items-center gap-3">
                                <div className="w-32 flex-shrink-0">
                                  <code className="text-xs text-primary">{param.name}</code>
                                  {param.required && <span className="text-destructive ml-1">*</span>}
                                  <p className="text-xs text-muted-foreground">{param.in}</p>
                                </div>
                                <Input
                                  value={tryItState?.paramValues[param.name] || ""}
                                  onChange={(e) => updateParamValue(key, param.name, e.target.value)}
                                  placeholder={param.description}
                                  className="flex-1 font-mono text-sm h-9"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Request Body */}
                        {endpoint.requestBody && (
                          <div className="space-y-2 mb-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Request Body</p>
                            <Textarea
                              value={tryItState?.bodyValue || ""}
                              onChange={(e) => updateBodyValue(key, e.target.value)}
                              className="font-mono text-sm min-h-[120px]"
                            />
                          </div>
                        )}

                        {/* Execute Button */}
                        <Button
                          onClick={() => executeRequest(key, endpoint)}
                          disabled={tryItState?.loading}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          {tryItState?.loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Execute Request
                            </>
                          )}
                        </Button>

                        {/* Response */}
                        {tryItState?.response && (
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Response</p>
                            <pre className="p-4 rounded-lg bg-background border border-border overflow-x-auto text-sm font-mono text-foreground max-h-64 overflow-y-auto">
                              {tryItState.response}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Responses Documentation */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Response Examples</h4>
                        <div className="space-y-2">
                          {Object.entries(endpoint.responses).map(([code, response]) => (
                            <div key={code} className="rounded-lg border border-border overflow-hidden">
                              <div className="flex items-center gap-2 p-3 bg-secondary/30">
                                <Badge variant={code.startsWith("2") ? "default" : "destructive"} className="font-mono">
                                  {code}
                                </Badge>
                                <span className="text-sm text-muted-foreground">{response.description}</span>
                              </div>
                              {response.example && (
                                <pre className="p-4 bg-background overflow-x-auto text-sm font-mono border-t border-border">
                                  {JSON.stringify(response.example, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* cURL Example */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">cURL Example</h4>
                        <div className="relative">
                          <pre className="p-4 rounded-lg bg-background border border-border overflow-x-auto text-sm font-mono text-muted-foreground">
                            {curlExample}
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyCode(curlExample, `curl-${key}`)}
                          >
                            {copiedCode === `curl-${key}` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function generateCurlExample(endpoint: Endpoint): string {
  let curl = `curl -X ${endpoint.method} "https://your-domain.com${endpoint.path}"`

  endpoint.parameters?.forEach((param) => {
    if (param.in === "header") {
      curl += ` \\\n  -H "${param.name}: ${param.defaultValue || "YOUR_VALUE"}"`
    }
  })

  if (endpoint.requestBody) {
    curl += ` \\\n  -H "Content-Type: ${endpoint.requestBody.contentType}"`
    if (endpoint.requestBody.contentType === "application/json") {
      curl += ` \\\n  -d '${JSON.stringify(endpoint.requestBody.example)}'`
    }
  }

  return curl
}
