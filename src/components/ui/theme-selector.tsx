"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { themes, Theme, getThemeClasses } from "@/lib/themes";
import { Palette, Check, Eye, Sparkles, Accessibility } from "lucide-react";

interface ThemeSelectorProps {
  currentTheme?: string;
  onThemeChange: (themeId: string) => void;
  loading?: boolean;
}

export function ThemeSelector({
  currentTheme = "cosmic-purple",
  onThemeChange,
  loading = false,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    onThemeChange(themeId);
  };

  const ThemePreview = ({ theme }: { theme: Theme }) => {
    const classes = getThemeClasses(theme);
    const isSelected = selectedTheme === theme.id;

    return (
      <Card
        className={`
          cursor-pointer transition-all duration-300 relative overflow-hidden group
          ${
            isSelected
              ? "ring-4 ring-blue-400 shadow-2xl scale-105"
              : "hover:shadow-xl hover:scale-102"
          }
        `}
        onClick={() => handleThemeSelect(theme.id)}
        role="button"
        tabIndex={0}
        aria-label={`Select ${theme.name} theme`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleThemeSelect(theme.id);
          }
        }}
      >
        {/* Theme preview background */}
        <div className={`h-24 ${classes.backgroundGradient} relative`}>
          {/* Decorative elements based on theme */}
          {theme.decorations?.orbs && (
            <>
              <div className="absolute top-2 left-2 w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
              <div
                className="absolute bottom-2 right-2 w-3 h-3 bg-white/15 rounded-full animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </>
          )}

          {theme.decorations?.particles && (
            <>
              <div
                className="absolute top-1/2 left-1/3 w-1 h-1 bg-white/30 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="absolute top-1/4 right-1/4 w-1 h-1 bg-white/25 rounded-full animate-bounce"
                style={{ animationDelay: "0.8s" }}
              ></div>
            </>
          )}

          {theme.decorations?.flora && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl opacity-70">🌿</div>
            </div>
          )}

          {theme.decorations?.shapes && (
            <>
              <div className="absolute top-3 right-3 w-2 h-2 bg-white/20 rotate-45"></div>
              <div className="absolute bottom-3 left-3 w-3 h-1 bg-white/15 rounded-full"></div>
            </>
          )}

          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label={theme.name}>
                {theme.preview}
              </span>
              <h3 className="font-bold text-gray-900">{theme.name}</h3>
            </div>
            <Badge
              variant="outline"
              className={`
                text-xs capitalize
                ${
                  theme.category === "elegant"
                    ? "border-amber-300 text-amber-700"
                    : ""
                }
                ${
                  theme.category === "festive"
                    ? "border-blue-300 text-blue-700"
                    : ""
                }
                ${
                  theme.category === "natural"
                    ? "border-green-300 text-green-700"
                    : ""
                }
                ${
                  theme.category === "modern"
                    ? "border-purple-300 text-purple-700"
                    : ""
                }
              `}
            >
              {theme.category}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {theme.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {theme.accessibility.highContrast && (
                <div title="High contrast support">
                  <Accessibility className="w-4 h-4 text-green-600" />
                </div>
              )}
              {theme.decorations?.flora && (
                <span className="text-green-600" title="Flora decorations">
                  🌸
                </span>
              )}
              {theme.animations.entrance.includes("sparkle") && (
                <div title="Sparkle animations">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
              )}
            </div>

            <div className="flex gap-1">
              {/* Color palette preview */}
              <div
                className={`w-3 h-3 rounded-full bg-gradient-to-r ${theme.colors.primary}`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full bg-gradient-to-r ${theme.colors.accent}`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full bg-gradient-to-r ${theme.colors.secondary}`}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Palette className="w-4 h-4" />
          Theme Settings
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-1">
            {themes.find((t) => t.id === currentTheme)?.name || "Cosmic Purple"}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            Guest View Themes
          </DialogTitle>
          <DialogDescription className="text-lg">
            Choose a beautiful theme for your event&apos;s guest view page. Each
            theme includes accessibility features and stunning animations.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Current selection info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-900">
                  Preview Your Theme
                </h4>
                <p className="text-blue-700 text-sm">
                  The selected theme will be applied to your guest view page.
                  Guests will see this design when they search for their tables.
                </p>
              </div>
            </div>
          </div>

          {/* Theme grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {themes.map((theme) => (
              <ThemePreview key={theme.id} theme={theme} />
            ))}
          </div>

          {/* Accessibility note */}
          <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-start gap-3">
              <Accessibility className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">
                  Accessibility Features
                </h4>
                <p className="text-green-700 text-sm">
                  All themes include high contrast support, keyboard navigation,
                  screen reader compatibility, and respect users&apos; motion
                  preferences. Animations can be disabled for users who prefer
                  reduced motion.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                window.open(
                  `/events/${
                    window.location.pathname.split("/")[2]
                  }/guest-view`,
                  "_blank"
                );
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? "Saving..." : "Save Theme"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
