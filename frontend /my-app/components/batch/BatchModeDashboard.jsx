'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Upload, 
  Users, 
  FileText, 
  Play, 
  BarChart3, 
  Filter,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  company: string
  industry: string
  status: string
  source: string
  phone?: string
  location?: string
  notes?: string
}

interface Draft {
  id: string
  lead_id: string
  lead_name: string
  lead_company: string
  draft_type: string
  email_draft: string
  formal_proposal: string
  insights: {
    overall_score: number
    success_probability: number
    strengths: string[]
    improvements: string[]
  }
  generated_at: string
}

interface Workflow {
  id: string
  name: string
  lead_ids: string[]
  status: string
  progress: number
  created_at: string
  completed_at?: string
}

interface Analytics {
  leads: {
    total: number
    by_industry: Record<string, number>
    by_status: Record<string, number>
    by_source: Record<string, number>
  }
  drafts: {
    total: number
    average_score: number
    average_success_probability: number
  }
  workflows: {
    total: number
    completed: number
    running: number
  }
}

export default function BatchModeDashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('leads')
  const [draftType, setDraftType] = useState<'email' | 'proposal'>('email')
  const [personalizationLevel, setPersonalizationLevel] = useState<'low' | 'medium' | 'high'>('high')
  const [searchResults, setSearchResults] = useState<Lead[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Fetch data on component mount
  useEffect(() => {
    fetchLeads()
    fetchDrafts()
    fetchWorkflows()
    fetchAnalytics()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/batch/leads`)
      const data = await response.json()
      if (response.ok) {
        setLeads(data.leads || [])
      } else {
        console.error('Failed to fetch leads:', data.detail)
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    }
  }

  const fetchDrafts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/batch/drafts`)
      const data = await response.json()
      if (response.ok) {
        setDrafts(data.drafts || [])
      } else {
        console.error('Failed to fetch drafts:', data.detail)
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    }
  }

  const fetchWorkflows = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/batch/workflows`)
      const data = await response.json()
      if (response.ok) {
        setWorkflows(data.workflows || [])
      } else {
        console.error('Failed to fetch workflows:', data.detail)
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/batch/analytics`)
      const data = await response.json()
      if (response.ok) {
        setAnalytics(data.analytics || null)
      } else {
        console.error('Failed to fetch analytics:', data.detail)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/batch/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (response.ok) {
        await fetchLeads()
        await fetchAnalytics()
        alert(`Successfully uploaded ${data.total_processed} leads!`)
      } else {
        alert(`Upload failed: ${data.detail}`)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed!')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedIndustry) {
      alert('Please enter a search query or select an industry')
      return
    }

    setIsSearching(true)
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/batch/leads/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          industry: selectedIndustry,
          status: '', // Add status filter if needed
          company_size: '', // Add company size filter if needed
          location: '', // Add location filter if needed
          limit: 100
        })
      })

      const data = await response.json()
      if (response.ok) {
        setSearchResults(data.leads || [])
        setLeads(data.leads || []) // Update main leads list too
        // Clear previous selections when searching
        setSelectedLeads([])
        alert(`Found ${data.total_found} leads matching your search`)
      } else {
        alert(`Search failed: ${data.detail}`)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      alert('Search failed!')
      setSearchResults([])
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  const handleClearSearch = async () => {
    setSearchQuery('')
    setSelectedIndustry('')
    setSearchResults([])
    setIsSearching(false)
    setLoading(true)
    try {
      await fetchLeads() // Reset to all leads
      setSelectedLeads([])
    } finally {
      setLoading(false)
    }
  }

  const generateDrafts = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads first!')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/batch/drafts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_ids: selectedLeads,
          draft_type: draftType,
          personalization_level: personalizationLevel,
          template_type: selectedIndustry || 'general'
        })
      })

      const data = await response.json()
      if (response.ok) {
        await fetchDrafts()
        await fetchAnalytics()
        alert(`Generated ${data.total_generated} ${draftType} drafts with ${personalizationLevel} personalization!`)
        
        // Switch to drafts tab to show results
        setActiveTab('drafts')
      } else {
        alert(`Draft generation failed: ${data.detail}`)
      }
    } catch (error) {
      console.error('Draft generation failed:', error)
      alert('Draft generation failed!')
    } finally {
      setLoading(false)
    }
  }

  const generateDraftsForSearchResults = async () => {
    if (searchResults.length === 0) {
      alert('No search results to generate drafts for!')
      return
    }

    setLoading(true)
    try {
      const leadIds = searchResults.map(lead => lead.id)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/batch/drafts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_ids: leadIds,
          draft_type: draftType,
          personalization_level: personalizationLevel,
          template_type: selectedIndustry || 'general'
        })
      })

      const data = await response.json()
      if (response.ok) {
        await fetchDrafts()
        await fetchAnalytics()
        alert(`Generated ${data.total_generated} ${draftType} drafts for ${searchResults.length} searched leads!`)
        
        // Switch to drafts tab to show results
        setActiveTab('drafts')
      } else {
        alert(`Draft generation failed: ${data.detail}`)
      }
    } catch (error) {
      console.error('Draft generation failed:', error)
      alert('Draft generation failed!')
    } finally {
      setLoading(false)
    }
  }

  const createWorkflow = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads first!')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/batch/workflows/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Batch Campaign - ${new Date().toLocaleDateString()}`,
          lead_ids: selectedLeads,
          steps: [
            {
              type: 'generate_drafts',
              draft_type: 'email',
              personalization_level: 'high'
            },
            {
              type: 'analyze_insights'
            }
          ]
        })
      })

      const data = await response.json()
      if (response.ok) {
        // Start the workflow
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/batch/workflows/${data.workflow.id}/start`, {
          method: 'POST'
        })

        await fetchWorkflows()
        await fetchAnalytics()
        alert('Workflow created and started!')
      } else {
        alert(`Workflow creation failed: ${data.detail}`)
      }
    } catch (error) {
      console.error('Workflow creation failed:', error)
      alert('Workflow creation failed!')
    } finally {
      setLoading(false)
    }
  }

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'created': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Mode</h1>
          <p className="text-gray-600">Manage leads, generate drafts, and automate workflows at scale</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.leads.total}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.leads.by_source.csv_upload || 0} from CSV
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Generated Drafts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.drafts.total}</div>
                <p className="text-xs text-muted-foreground">
                  Avg score: {analytics.drafts.average_score.toFixed(1)}/10
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.drafts.average_success_probability.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average probability
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workflows</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.workflows.completed}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.workflows.running} running
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" asChild disabled={loading}>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </span>
              </Button>
            </label>
          </div>

          {/* Draft Type Selection */}
          <select
            value={draftType}
            onChange={(e) => setDraftType(e.target.value as 'email' | 'proposal')}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="email">Email Drafts</option>
            <option value="proposal">Formal Proposals</option>
          </select>

          {/* Personalization Level */}
          <select
            value={personalizationLevel}
            onChange={(e) => setPersonalizationLevel(e.target.value as 'low' | 'medium' | 'high')}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="low">Low Personalization</option>
            <option value="medium">Medium Personalization</option>
            <option value="high">High Personalization</option>
          </select>

          <Button 
            onClick={generateDrafts}
            disabled={selectedLeads.length === 0 || loading}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate for Selected ({selectedLeads.length})
          </Button>

          {isSearching && searchResults.length > 0 && (
            <Button 
              onClick={generateDraftsForSearchResults}
              disabled={loading}
              variant="default"
            >
              <Target className="h-4 w-4 mr-2" />
              Generate for Search Results ({searchResults.length})
            </Button>
          )}

          <Button 
            onClick={createWorkflow}
            disabled={selectedLeads.length === 0 || loading}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Workflow
          </Button>

          <Button variant="outline" onClick={() => fetchAnalytics()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-4">
            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Filter Leads
                  {isSearching && (
                    <Badge className="ml-2" variant="default">
                      {searchResults.length} Results
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Search by name, company, email, or filter by industry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Search leads by name, company, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">All Industries</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Education">Education</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Consulting">Consulting</option>
                    </select>
                    <Button onClick={handleSearch} disabled={loading}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    {isSearching && (
                      <Button variant="outline" onClick={handleClearSearch} disabled={loading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Quick Actions for Search Results */}
                  {isSearching && searchResults.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Found {searchResults.length} leads matching your search
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const allIds = searchResults.map(lead => lead.id)
                            setSelectedLeads(allIds)
                          }}
                        >
                          Select All ({searchResults.length})
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={generateDraftsForSearchResults}
                          disabled={loading}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Generate Drafts
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leads List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Leads ({leads.length})
                  {isSearching && (
                    <Badge className="ml-2" variant="secondary">
                      Search Results
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {isSearching 
                    ? `Search results for "${searchQuery}"${selectedIndustry ? ` in ${selectedIndustry}` : ''}. Select leads to generate drafts.`
                    : 'Select leads to generate drafts or start workflows'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedLeads.includes(lead.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleLeadSelection(lead.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => {}}
                            className="h-4 w-4"
                          />
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-gray-600">{lead.email}</div>
                            <div className="text-sm text-gray-500">{lead.company} • {lead.industry}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{lead.source}</Badge>
                          <Badge variant="secondary">{lead.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generated Drafts ({drafts.length})</CardTitle>
                <CardDescription>
                  AI-generated emails and proposals with insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">{draft.lead_name} - {draft.lead_company}</div>
                          <div className="text-sm text-gray-600">
                            {draft.draft_type} • {new Date(draft.generated_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`text-sm font-medium ${getScoreColor(draft.insights.overall_score)}`}>
                            Score: {draft.insights.overall_score}/10
                          </div>
                          <Badge variant="outline">
                            {draft.insights.success_probability}% success
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-sm font-medium mb-1">Email Preview:</div>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {draft.email_draft.substring(0, 200)}...
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-green-600 mb-1">Strengths:</div>
                          <ul className="list-disc list-inside text-gray-600">
                            {draft.insights.strengths.slice(0, 2).map((strength, i) => (
                              <li key={i}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-medium text-orange-600 mb-1">Improvements:</div>
                          <ul className="list-disc list-inside text-gray-600">
                            {draft.insights.improvements.slice(0, 2).map((improvement, i) => (
                              <li key={i}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflows ({workflows.length})</CardTitle>
                <CardDescription>
                  Automated batch processing workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-sm text-gray-600">
                            {workflow.lead_ids.length} leads • Created {new Date(workflow.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(workflow.status)}>
                            {workflow.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{workflow.progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={workflow.progress} className="h-2" />
                      </div>

                      {workflow.completed_at && (
                        <div className="text-sm text-gray-600">
                          Completed {new Date(workflow.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {analytics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Leads by Industry</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(analytics.leads.by_industry).map(([industry, count]) => (
                          <div key={industry} className="flex justify-between">
                            <span>{industry}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Lead Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(analytics.leads.by_source).map(([source, count]) => (
                          <div key={source} className="flex justify-between">
                            <span>{source}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.drafts.average_score.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">Avg Draft Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.drafts.average_success_probability.toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {analytics.workflows.completed}
                        </div>
                        <div className="text-sm text-gray-600">Completed Workflows</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {analytics.leads.total}
                        </div>
                        <div className="text-sm text-gray-600">Total Leads</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
