import React, { useState, useCallback } from 'react';
import { Editor, EditorState, RichUtils, getDefaultKeyBinding, KeyBindingUtil, Modifier } from 'draft-js';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Code,
    Subscript,
    Superscript,
    Palette,
    Highlighter,
    Link,
    Undo,
    Redo
} from 'lucide-react';
import 'draft-js/dist/Draft.css';

interface RichTextEditorProps {
    editorState: EditorState;
    onChange: (editorState: EditorState) => void;
    placeholder?: string;
    className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    editorState,
    onChange,
    placeholder = "Start writing...",
    className = ""
}) => {
    const [hasFocus, setHasFocus] = useState(false);

    const handleKeyCommand = useCallback((command: string, editorState: EditorState) => {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            onChange(newState);
            return 'handled';
        }
        return 'not-handled';
    }, [onChange]);

    const mapKeyToEditorCommand = useCallback((e: React.KeyboardEvent) => {
        if (e.keyCode === 9 /* TAB */) {
            const newEditorState = RichUtils.onTab(
                e,
                editorState,
                4, /* maxDepth */
            );
            if (newEditorState !== editorState) {
                onChange(newEditorState);
            }
            return;
        }
        return getDefaultKeyBinding(e);
    }, [editorState, onChange]);

    const toggleBlockType = useCallback((blockType: string) => {
        onChange(RichUtils.toggleBlockType(editorState, blockType));
    }, [editorState, onChange]);

    const toggleInlineStyle = useCallback((inlineStyle: string) => {
        onChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    }, [editorState, onChange]);

    const applyInlineStyle = useCallback((style: string) => {
        const currentContent = editorState.getCurrentContent();
        const selection = editorState.getSelection();
        const newContentState = Modifier.applyInlineStyle(currentContent, selection, style);
        const newEditorState = EditorState.push(editorState, newContentState, 'change-inline-style');
        onChange(newEditorState);
    }, [editorState, onChange]);

    const handleFontSizeChange = useCallback((fontSize: string) => {
        // Remove any existing font size styles
        let newEditorState = editorState;
        const currentStyle = editorState.getCurrentInlineStyle();
        currentStyle.forEach(style => {
            if (style && style.startsWith('FONTSIZE_')) {
                newEditorState = RichUtils.toggleInlineStyle(newEditorState, style);
            }
        });
        // Apply new font size
        onChange(RichUtils.toggleInlineStyle(newEditorState, `FONTSIZE_${fontSize}`));
    }, [editorState, onChange]);

    const handleTextColorChange = useCallback((color: string) => {
        // Remove any existing color styles
        let newEditorState = editorState;
        const currentStyle = editorState.getCurrentInlineStyle();
        currentStyle.forEach(style => {
            if (style && style.startsWith('COLOR_')) {
                newEditorState = RichUtils.toggleInlineStyle(newEditorState, style);
            }
        });
        // Apply new color
        onChange(RichUtils.toggleInlineStyle(newEditorState, `COLOR_${color.replace('#', '')}`));
    }, [editorState, onChange]);

    const handleBackgroundColorChange = useCallback((color: string) => {
        // Remove any existing background color styles
        let newEditorState = editorState;
        const currentStyle = editorState.getCurrentInlineStyle();
        currentStyle.forEach(style => {
            if (style && style.startsWith('BGCOLOR_')) {
                newEditorState = RichUtils.toggleInlineStyle(newEditorState, style);
            }
        });
        // Apply new background color
        onChange(RichUtils.toggleInlineStyle(newEditorState, `BGCOLOR_${color.replace('#', '')}`));
    }, [editorState, onChange]);

    const customStyleMap = {
        // Font sizes
        FONTSIZE_8: { fontSize: '8px' },
        FONTSIZE_9: { fontSize: '9px' },
        FONTSIZE_10: { fontSize: '10px' },
        FONTSIZE_11: { fontSize: '11px' },
        FONTSIZE_12: { fontSize: '12px' },
        FONTSIZE_14: { fontSize: '14px' },
        FONTSIZE_16: { fontSize: '16px' },
        FONTSIZE_18: { fontSize: '18px' },
        FONTSIZE_20: { fontSize: '20px' },
        FONTSIZE_24: { fontSize: '24px' },
        FONTSIZE_28: { fontSize: '28px' },
        FONTSIZE_32: { fontSize: '32px' },
        FONTSIZE_36: { fontSize: '36px' },
        FONTSIZE_48: { fontSize: '48px' },
        FONTSIZE_72: { fontSize: '72px' },

        // Text colors
        COLOR_ff0000: { color: '#ff0000' },
        COLOR_00ff00: { color: '#00ff00' },
        COLOR_0000ff: { color: '#0000ff' },
        COLOR_ffff00: { color: '#ffff00' },
        COLOR_ff00ff: { color: '#ff00ff' },
        COLOR_00ffff: { color: '#00ffff' },
        COLOR_000000: { color: '#000000' },
        COLOR_808080: { color: '#808080' },
        COLOR_800000: { color: '#800000' },
        COLOR_008000: { color: '#008000' },
        COLOR_000080: { color: '#000080' },
        COLOR_800080: { color: '#800080' },
        COLOR_008080: { color: '#008080' },
        COLOR_808000: { color: '#808000' },

        // Background colors
        BGCOLOR_ffff00: { backgroundColor: '#ffff00' },
        BGCOLOR_00ff00: { backgroundColor: '#00ff00' },
        BGCOLOR_00ffff: { backgroundColor: '#00ffff' },
        BGCOLOR_ff00ff: { backgroundColor: '#ff00ff' },
        BGCOLOR_ffa500: { backgroundColor: '#ffa500' },
        BGCOLOR_ff69b4: { backgroundColor: '#ff69b4' },
        BGCOLOR_98fb98: { backgroundColor: '#98fb98' },
        BGCOLOR_87ceeb: { backgroundColor: '#87ceeb' },
        BGCOLOR_dda0dd: { backgroundColor: '#dda0dd' },
        BGCOLOR_f0e68c: { backgroundColor: '#f0e68c' },

        // Custom styles
        STRIKETHROUGH: { textDecoration: 'line-through' },
        SUPERSCRIPT: { fontSize: '0.8em', verticalAlign: 'super' },
        SUBSCRIPT: { fontSize: '0.8em', verticalAlign: 'sub' },
        CODE: {
            fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
            backgroundColor: '#f1f3f4',
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '0.9em'
        }
    };

    const currentStyle = editorState.getCurrentInlineStyle();
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();

    // Get current font size
    const getCurrentFontSize = () => {
        const currentStyle = editorState.getCurrentInlineStyle();
        for (const style of currentStyle) {
            if (style && style.startsWith('FONTSIZE_')) {
                return style.replace('FONTSIZE_', '');
            }
        }
        return '14'; // default
    };

    const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];
    const textColors = [
        { name: 'Black', value: '#000000' },
        { name: 'Red', value: '#ff0000' },
        { name: 'Green', value: '#00ff00' },
        { name: 'Blue', value: '#0000ff' },
        { name: 'Yellow', value: '#ffff00' },
        { name: 'Magenta', value: '#ff00ff' },
        { name: 'Cyan', value: '#00ffff' },
        { name: 'Gray', value: '#808080' },
        { name: 'Maroon', value: '#800000' },
        { name: 'Dark Green', value: '#008000' },
        { name: 'Navy', value: '#000080' },
        { name: 'Purple', value: '#800080' },
        { name: 'Teal', value: '#008080' },
        { name: 'Olive', value: '#808000' }
    ];

    const highlightColors = [
        { name: 'Yellow', value: '#ffff00' },
        { name: 'Green', value: '#00ff00' },
        { name: 'Cyan', value: '#00ffff' },
        { name: 'Magenta', value: '#ff00ff' },
        { name: 'Orange', value: '#ffa500' },
        { name: 'Pink', value: '#ff69b4' },
        { name: 'Light Green', value: '#98fb98' },
        { name: 'Light Blue', value: '#87ceeb' },
        { name: 'Plum', value: '#dda0dd' },
        { name: 'Khaki', value: '#f0e68c' }
    ];

    return (
        <div className={`border rounded-lg ${hasFocus ? 'ring-2 ring-primary' : ''} ${className}`}>
            {/* Toolbar */}
            <div className="border-b p-2 space-y-2">
                {/* First Row - Basic Formatting */}
                <div className="flex gap-1 flex-wrap items-center">
                    {/* Undo/Redo */}
                    <div className="flex gap-1 border-r pr-2 mr-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(EditorState.undo(editorState));
                            }}
                            className="h-8 w-8 p-0"
                            disabled={editorState.getUndoStack().size === 0}
                        >
                            <Undo className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(EditorState.redo(editorState));
                            }}
                            className="h-8 w-8 p-0"
                            disabled={editorState.getRedoStack().size === 0}
                        >
                            <Redo className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Font Size */}
                    <div className="flex gap-1 border-r pr-2 mr-2">
                        <Select value={getCurrentFontSize()} onValueChange={handleFontSizeChange}>
                            <SelectTrigger className="h-8 w-16 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {fontSizes.map((size) => (
                                    <SelectItem key={size} value={size}>
                                        {size}px
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Basic Text Formatting */}
                    <div className="flex gap-1 border-r pr-2 mr-2">
                        <Button
                            type="button"
                            variant={currentStyle.has('BOLD') ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleInlineStyle('BOLD');
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant={currentStyle.has('ITALIC') ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleInlineStyle('ITALIC');
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant={currentStyle.has('UNDERLINE') ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleInlineStyle('UNDERLINE');
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <Underline className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant={currentStyle.has('STRIKETHROUGH') ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleInlineStyle('STRIKETHROUGH');
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <Strikethrough className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Super/Subscript and Code */}
                    <div className="flex gap-1 border-r pr-2 mr-2">
                        <Button
                            type="button"
                            variant={currentStyle.has('SUPERSCRIPT') ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleInlineStyle('SUPERSCRIPT');
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <Superscript className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant={currentStyle.has('SUBSCRIPT') ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleInlineStyle('SUBSCRIPT');
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <Subscript className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant={currentStyle.has('CODE') ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleInlineStyle('CODE');
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <Code className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Text Color */}
                    <div className="flex gap-1 border-r pr-2 mr-2">
                        <Select onValueChange={handleTextColorChange}>
                            <SelectTrigger className="h-8 w-20 text-xs">
                                <div className="flex items-center gap-1">
                                    <Palette className="h-3 w-3" />
                                    <span>Color</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {textColors.map((color) => (
                                    <SelectItem key={color.value} value={color.value}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded border"
                                                style={{ backgroundColor: color.value }}
                                            />
                                            {color.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={handleBackgroundColorChange}>
                            <SelectTrigger className="h-8 w-24 text-xs">
                                <div className="flex items-center gap-1">
                                    <Highlighter className="h-3 w-3" />
                                    <span>Highlight</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {highlightColors.map((color) => (
                                    <SelectItem key={color.value} value={color.value}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded border"
                                                style={{ backgroundColor: color.value }}
                                            />
                                            {color.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator />

                {/* Second Row - Block Formatting */}
                <div className="flex gap-1 flex-wrap items-center">
                    {/* Headers */}
                    <div className="flex gap-1 border-r pr-2 mr-2">
                        <Button
                            type="button"
                            variant={blockType === 'header-one' ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleBlockType('header-one');
                            }}
                            className="h-8 px-2 text-xs"
                        >
                            H1
                        </Button>
                        <Button
                            type="button"
                            variant={blockType === 'header-two' ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleBlockType('header-two');
                            }}
                            className="h-8 px-2 text-xs"
                        >
                            H2
                        </Button>
                        <Button
                            type="button"
                            variant={blockType === 'header-three' ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleBlockType('header-three');
                            }}
                            className="h-8 px-2 text-xs"
                        >
                            H3
                        </Button>
                        <Button
                            type="button"
                            variant={blockType === 'header-four' ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleBlockType('header-four');
                            }}
                            className="h-8 px-2 text-xs"
                        >
                            H4
                        </Button>
                    </div>

                    {/* Lists and Quote */}
                    <div className="flex gap-1 border-r pr-2 mr-2">
                        <Button
                            type="button"
                            variant={blockType === 'unordered-list-item' ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleBlockType('unordered-list-item');
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant={blockType === 'ordered-list-item' ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleBlockType('ordered-list-item');
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant={blockType === 'blockquote' ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleBlockType('blockquote');
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <Quote className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant={blockType === 'code-block' ? 'default' : 'ghost'}
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                toggleBlockType('code-block');
                            }}
                            className="h-8 px-2 text-xs"
                        >
                            Code
                        </Button>
                    </div>

                    {/* Text Alignment */}
                    <div className="flex gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                // Text alignment would require custom block styling
                                // For now, just visual feedback
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                // Text alignment would require custom block styling
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                // Text alignment would require custom block styling
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <AlignRight className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                // Text alignment would require custom block styling
                            }}
                            className="h-8 w-8 p-0"
                        >
                            <AlignJustify className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="min-h-[200px] p-4">
                <Editor
                    editorState={editorState}
                    handleKeyCommand={handleKeyCommand}
                    keyBindingFn={mapKeyToEditorCommand}
                    onChange={onChange}
                    placeholder={placeholder}
                    onFocus={() => setHasFocus(true)}
                    onBlur={() => setHasFocus(false)}
                    spellCheck={true}
                    customStyleMap={customStyleMap}
                />
            </div>
        </div>
    );
};

export default RichTextEditor;
