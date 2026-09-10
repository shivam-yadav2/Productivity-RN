import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

interface Props {
  children: React.ReactNode;
  /** Shown above the error so the user knows which part failed. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors so one broken screen doesn't take the whole app down to a blank
 * white view with no way back.
 *
 * Deliberately plain inline styles and no app dependencies: this has to be able to render
 * when something in the theme, database, or component tree is the thing that just failed.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // No crash reporting in an offline app — this at least surfaces it in `adb logcat`.
    console.error('[ErrorBoundary]', this.props.label ?? 'app', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: '#18161D', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#F7F5F2', fontSize: 20, fontWeight: '800', marginBottom: 6 }}>
          Something broke
        </Text>
        <Text style={{ color: '#A79D8C', fontSize: 13, marginBottom: 18 }}>
          {this.props.label
            ? `The ${this.props.label} screen hit an error. Your data is safe — it's saved on the device, not here.`
            : "This screen hit an error. Your data is safe — it's saved on the device, not here."}
        </Text>

        <ScrollView
          style={{ maxHeight: 180, backgroundColor: '#2A2830', borderRadius: 14, padding: 12 }}
        >
          <Text style={{ color: '#CCC3B2', fontSize: 11, fontFamily: 'monospace' }}>
            {error.message || String(error)}
          </Text>
        </ScrollView>

        <Pressable
          onPress={this.reset}
          style={{
            marginTop: 20,
            backgroundColor: '#F7F5F2',
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#18161D', fontSize: 15, fontWeight: '700' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}
