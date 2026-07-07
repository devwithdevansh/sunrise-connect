import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppSound { click, toggle, success, pop, error }

class SoundService {
  SoundService._internal();
  static final SoundService instance = SoundService._internal();

  bool _soundEnabled = true;
  static const _soundPrefKey = 'sound_enabled';
  
  // Keep references to prevent premature garbage collection
  final Set<AudioPlayer> _activePlayers = {};

  final Map<AppSound, String> _files = {
    AppSound.click: 'sounds/click.ogg',
    AppSound.toggle: 'sounds/toggle.ogg',
    AppSound.success: 'sounds/success.ogg',
    AppSound.pop: 'sounds/pop.ogg',
    AppSound.error: 'sounds/error.ogg',
  };

  /// Call once in main() before runApp()
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _soundEnabled = prefs.getBool(_soundPrefKey) ?? true;
  }

  Future<void> play(AppSound sound) async {
    print('DEBUG: SoundService.play requested for: ${sound.name}');
    if (!_soundEnabled) {
      print('DEBUG: Sound is disabled in preferences.');
      return;
    }
    try {
      final player = AudioPlayer();
      _activePlayers.add(player);
      
      final source = AssetSource(_files[sound]!);
      print('DEBUG: Attempting to play source: ${source.path}');
      
      await player.play(source);
      print('DEBUG: Successfully sent play command to platform');
      
      player.onPlayerComplete.listen((_) {
        print('DEBUG: Playback completed for: ${sound.name}');
        player.dispose();
        _activePlayers.remove(player);
      });
    } catch (e) {
      print('DEBUG: Sound play error: $e');
    }
  }

  Future<void> setSoundEnabled(bool value) async {
    _soundEnabled = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_soundPrefKey, value);
  }

  bool get soundEnabled => _soundEnabled;

  Future<void> dispose() async {}
}
