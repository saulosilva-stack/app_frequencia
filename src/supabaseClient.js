import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kmrzgnyyeaaiowaqmavu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttcnpnbnl5ZWFhaW93YXFtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMzYyOTUsImV4cCI6MjA5MTcxMjI5NX0.S74bdTjd0-QgOxShSrdpXSRNTdCqLH2jG8-0QI8VnzY'

export const supabase = createClient(supabaseUrl, supabaseKey)