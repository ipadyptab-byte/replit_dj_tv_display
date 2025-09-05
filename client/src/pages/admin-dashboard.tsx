import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { insertDisplaySettingsSchema } from "@shared/schema";
import type { DisplaySettings, InsertDisplaySettings } from "@shared/schema";

// Direct API call functions that work with your queryClient setup
const displaySettingsApi = {
  getDisplay: async (): Promise<DisplaySettings | null> => {
    try {
      const response = await apiRequest("GET", "/api/settings/display");
      const data = await response.json();
      return data as DisplaySettings;
    } catch (error) {
      console.error("Failed to fetch display settings:", error);
      return null;
    }
  },

  createDisplay: async (settings: InsertDisplaySettings): Promise<DisplaySettings> => {
    const response = await apiRequest("POST", "/api/settings/display", settings);
    return response.json();
  },

  updateDisplay: async (id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings> => {
    const response = await apiRequest("PUT", `/api/settings/display/${id}`, settings);
    return response.json();
  }
};

// System API using your apiRequest function
const systemApi = {
  getInfo: async () => {
    const response = await apiRequest("GET", "/api/system/info");
    return response.json();
  }
};

// Mutation function using your existing queryClient infrastructure
const useDisplaySettingsMutation = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertDisplaySettings) => {
      try {
        // Get current settings first
        const currentSettings = await displaySettingsApi.getDisplay();
        
        if (currentSettings?.id) {
          // Update existing settings
          return await displaySettingsApi.updateDisplay(currentSettings.id, data);
        } else {
          // Create new settings
          return await displaySettingsApi.createDisplay(data);
        }
      } catch (error) {
        console.error("Settings mutation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Update the query cache with the new data
      queryClient.setQueryData(["/api/settings/display"], data);
      
      toast({
        title: "Success",
        description: "Display settings saved successfully!",
        className: cn(
          "bg-green-50 text-green-900 border-green-200"
        ),
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      
      let errorMessage = "Failed to save settings. Please try again.";
      
      if (error.message.includes("401")) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
        errorMessage = "Network connection failed. Please check your internet connection.";
      } else if (error.message.includes("500")) {
        errorMessage = "Server error. Please try again later.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        className: cn(
          "bg-red-50 text-red-900 border-red-200"
        ),
      });
    },
  });
};

export default function AdminDashboard() {
  const { toast } = useToast();

  // Get current settings using your queryClient
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/settings/display"],
    queryFn: () => displaySettingsApi.getDisplay(),
    retry: 2,
  });

  // Get system info
  const { data: systemInfo } = useQuery({
    queryKey: ["/api/system/info"],
    queryFn: systemApi.getInfo,
    refetchInterval: 30000,
  });

  // Use the mutation
  const updateSettingsMutation = useDisplaySettingsMutation();

  // Form setup
  const form = useForm<InsertDisplaySettings>({
    resolver: zodResolver(insertDisplaySettingsSchema),
    defaultValues: {
      orientation: "horizontal",
      background_color: "#FFF8E1",
      text_color: "#212529",
      rate_number_font_size: "text-4xl",
      show_media: true,
      rates_display_duration_seconds: 15,
      refresh_interval: 30,
    },
  });

  // Update form when settings load
  React.useEffect(() => {
    if (settings) {
      const cleanedSettings = {
        orientation: settings.orientation || "horizontal",
        background_color: settings.background_color || "#FFF8E1",
        text_color: settings.text_color || "#212529",
        rate_number_font_size: settings.rate_number_font_size || "text-4xl",
        show_media: settings.show_media ?? true,
        rates_display_duration_seconds: settings.rates_display_duration_seconds || 15,
        refresh_interval: settings.refresh_interval || 30,
      };
      form.reset(cleanedSettings);
    }
  }, [settings, form]);

  const onSubmit = (data: InsertDisplaySettings) => {
    updateSettingsMutation.mutate(data);
  };

  const colorPresets = [
    {
      name: "Gold Theme",
      colors: { background: "#FFF8E1", text: "#212529", accent: "#FFC107" },
    },
    {
      name: "Blue Theme",
      colors: { background: "#E3F2FD", text: "#1565C0", accent: "#2196F3" },
    },
    {
      name: "Green Theme",
      colors: { background: "#E8F5E8", text: "#2E7D32", accent: "#4CAF50" },
    },
    {
      name: "Purple Theme",
      colors: { background: "#F3E5F5", text: "#6A1B9A", accent: "#9C27B0" },
    },
  ];

  if (isLoading) {
    return (
      <div className={cn("min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center")}>
        <div className="text-center">
          <div className={cn("w-8 h-8 border-2 border-jewelry-primary border-t-transparent rounded-full animate-spin mx-auto mb-4")}></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center")}>
        <div className="text-center">
          <div className={cn("w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4")}>
            <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load settings
          </h2>
          <p className="text-gray-600 mb-4">
            Please check your connection and try again.
          </p>
          <Button
            onClick={() => queryClient.refetchQueries({ queryKey: ["/api/settings/display"] })}
            className="bg-jewelry-primary text-white"
          >
            <i className="fas fa-refresh mr-2"></i>Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4")}>
      <div className="max-w-6xl mx-auto">
        {/* Dashboard Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-jewelry-primary to-jewelry-secondary rounded-xl flex items-center justify-center">
              <i className="fas fa-gem text-white text-xl"></i>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            Admin Dashboard
          </h2>
          <p className="text-gray-600">
            Manage display settings, timing, and appearance
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Display Settings Card */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  <CardTitle className="flex items-center">
                    <i className="fas fa-desktop mr-2"></i>Display Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="orientation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TV Orientation</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "horizontal"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select orientation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="horizontal">
                              Horizontal (Landscape)
                            </SelectItem>
                            <SelectItem value="vertical">
                              Vertical (Portrait)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rate_number_font_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate Numbers Font Size</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "text-4xl"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select font size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text-2xl">
                              Small (2XL)
                            </SelectItem>
                            <SelectItem value="text-3xl">
                              Medium (3XL)
                            </SelectItem>
                            <SelectItem value="text-4xl">
                              Large (4XL)
                            </SelectItem>
                            <SelectItem value="text-5xl">
                              Extra Large (5XL)
                            </SelectItem>
                            <SelectItem value="text-6xl">Huge (6XL)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="show_media"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <FormLabel className="font-medium text-gray-800">
                            Show Media Rotation
                          </FormLabel>
                          <p className="text-sm text-gray-600">
                            Alternate between rates and promotional content
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Color Customization Card */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardTitle className="flex items-center">
                    <i className="fas fa-palette mr-2"></i>Color Customization
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="background_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Color</FormLabel>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={field.value || "#FFF8E1"}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <FormControl>
                            <Input {...field} value={field.value || ""} className="flex-1" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="text_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text Color</FormLabel>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={field.value || "#212529"}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <FormControl>
                            <Input {...field} value={field.value || ""} className="flex-1" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color Presets */}
                  <div>
                    <FormLabel>Quick Presets</FormLabel>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {colorPresets.map((preset, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full h-8 rounded hover:scale-105 transition-transform"
                          style={{
                            background: `linear-gradient(to right, ${preset.colors.background}, ${preset.colors.accent})`,
                          }}
                          title={preset.name}
                          onClick={() => {
                            form.setValue("background_color", preset.colors.background);
                            form.setValue("text_color", preset.colors.text);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timing Settings Card */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                  <CardTitle className="flex items-center">
                    <i className="fas fa-clock mr-2"></i>Timing Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="refresh_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refresh Interval (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="10"
                            max="300"
                            {...field}
                            value={field.value ?? 30}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-600">
                          How often to check for rate updates
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rates_display_duration_seconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rates Display Duration (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="5"
                            max="60"
                            {...field}
                            value={field.value ?? 15}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-600">
                          How long to show rates before switching to media
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {systemInfo && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-1">
                        Current Status
                      </h4>
                      <p className="text-sm text-green-700">
                        Status: {systemInfo.status}
                      </p>
                      <p className="text-sm text-green-700">
                        Last sync: {systemInfo.last_sync}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Information Card */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <CardTitle className="flex items-center">
                    <i className="fas fa-info-circle mr-2"></i>System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {systemInfo && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Server Status:</span>
                        <span className="text-green-600 font-semibold flex items-center">
                          <i className="fas fa-circle text-xs mr-1"></i>
                          {systemInfo.status}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Local IP:</span>
                        <span className="font-mono text-sm">
                          {systemInfo.local_ip}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Connected Devices:</span>
                        <span className="font-semibold">
                          {systemInfo.connected_devices}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage Used:</span>
                        <span className="font-semibold">
                          {systemInfo.storage_used} / {systemInfo.storage_total}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-blue-700 border-blue-200 hover:bg-blue-50"
                      >
                        <i className="fas fa-sync-alt mr-1"></i>Sync Now
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-700 border-red-200 hover:bg-red-50"
                      >
                        <i className="fas fa-power-off mr-1"></i>Restart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Save Settings Button */}
            <div className="text-center mt-6">
              <Button
                type="submit"
                className={cn(
                  "bg-gradient-to-r from-jewelry-primary to-jewelry-secondary",
                  "text-white px-8 py-4 text-lg hover:opacity-90 transition-opacity"
                )}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <div className={cn("w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2")}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save All Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
